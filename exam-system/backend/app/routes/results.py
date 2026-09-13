"""
Results routes — student result view and admin results management with export.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database.connection import get_db
from app.auth.jwt import get_current_user, require_admin
from app.models.user import User
from app.models.student import Student
from app.models.attempt import ExamAttempt
from app.models.result import Result
from app.services.result_service import get_answer_review
from app.services.export_service import export_results_csv, export_results_excel, export_results_pdf

router = APIRouter()


@router.get("/results/{attempt_id}")
def get_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    # Students can only see their own results
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or attempt.student_id != student.id:
            raise HTTPException(status_code=403, detail="Access denied")

    result = attempt.result
    if not result:
        raise HTTPException(status_code=404, detail="Result not calculated yet")

    exam = attempt.exam
    response = {
        "attempt_id": attempt.id,
        "exam_id": attempt.exam_id,
        "exam_title": exam.title if exam else "",
        "exam_subject": exam.subject if exam else "",
        "student_name": attempt.student.name if attempt.student else "",
        "reg_number": attempt.student.reg_number if attempt.student else "",
        "status": attempt.status,
        "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
        "result": {
            "correct_count": result.correct_count,
            "incorrect_count": result.incorrect_count,
            "unanswered_count": result.unanswered_count,
            "total_marks": result.total_marks,
            "max_marks": result.max_marks,
            "percentage": result.percentage,
            "accuracy": result.accuracy,
            "passed": result.passed,
            "time_taken_seconds": result.time_taken_seconds,
        },
        "show_correct_answers": exam.show_correct_answers if exam else False,
        "show_explanations": exam.show_explanations if exam else False,
        "leaderboard_enabled": exam.leaderboard_enabled if exam else False,
        "answer_review": None,
    }

    # Include answer review only if allowed
    if exam and exam.show_correct_answers:
        review = get_answer_review(attempt)
        if exam.show_explanations:
            # Add explanations from DB
            from app.models.question import Question
            for item in review:
                q = db.query(Question).filter(Question.id == item["question_id"]).first()
                item["explanation"] = q.explanation if q else None
        response["answer_review"] = review

    return response


@router.get("/admin/results")
def admin_results(
    exam_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    passed: Optional[bool] = Query(None),
    sort_by: str = Query("submitted_at"),
    order: str = Query("desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.status.in_(["submitted", "timed_out", "flagged"]))
    )
    if exam_id:
        q = q.filter(ExamAttempt.exam_id == exam_id)

    if search:
        q = q.join(Student).filter(
            (Student.name.ilike(f"%{search}%")) |
            (Student.reg_number.ilike(f"%{search}%"))
        )

    total = q.count()
    attempts = q.offset(skip).limit(limit).all()

    rows = []
    for a in attempts:
        result = a.result
        if not result:
            continue
        if passed is not None and result.passed != passed:
            continue
        rows.append({
            "attempt_id": a.id,
            "student_name": a.student.name if a.student else "",
            "reg_number": a.student.reg_number if a.student else "",
            "exam_title": a.exam.title if a.exam else "",
            "exam_id": a.exam_id,
            "total_marks": result.total_marks,
            "max_marks": result.max_marks,
            "percentage": result.percentage,
            "correct_count": result.correct_count,
            "incorrect_count": result.incorrect_count,
            "unanswered_count": result.unanswered_count,
            "time_taken_seconds": result.time_taken_seconds,
            "passed": result.passed,
            "status": a.status,
            "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
        })

    return {"items": rows, "total": total, "skip": skip, "limit": limit}


@router.get("/admin/results/export")
def export_results(
    exam_id: Optional[int] = Query(None),
    format: str = Query("csv", regex="^(csv|excel|pdf)$"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(ExamAttempt).filter(ExamAttempt.status.in_(["submitted", "timed_out", "flagged"]))
    if exam_id:
        q = q.filter(ExamAttempt.exam_id == exam_id)
    attempts = q.all()

    exam_title = "All Exams"
    if exam_id:
        from app.models.exam import Exam
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if exam:
            exam_title = exam.title

    rows = []
    for a in attempts:
        result = a.result
        if not result:
            continue
        rows.append({
            "Registration No": a.student.reg_number if a.student else "",
            "Student Name": a.student.name if a.student else "",
            "Exam": a.exam.title if a.exam else "",
            "Score": f"{result.total_marks}/{result.max_marks}",
            "Percentage": f"{result.percentage}%",
            "Correct": result.correct_count,
            "Incorrect": result.incorrect_count,
            "Unanswered": result.unanswered_count,
            "Time (min)": round(result.time_taken_seconds / 60, 1),
            "Status": "PASS" if result.passed else "FAIL",
            "Submitted At": a.submitted_at.strftime("%Y-%m-%d %H:%M") if a.submitted_at else "",
        })

    if format == "csv":
        content = export_results_csv(rows)
        return StreamingResponse(
            io.BytesIO(content),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="results.csv"'},
        )
    elif format == "excel":
        content = export_results_excel(rows, exam_title)
        return StreamingResponse(
            io.BytesIO(content),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="results.xlsx"'},
        )
    elif format == "pdf":
        content = export_results_pdf(exam_title, rows)
        return StreamingResponse(
            io.BytesIO(content),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="results.pdf"'},
        )
