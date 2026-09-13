"""
Student Exams routes — available exams, instructions, start exam.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.jwt import require_student
from app.models.user import User
from app.models.exam import Exam
from app.models.attempt import ExamAttempt
from app.models.student import Student
from app.services.exam_service import update_exam_statuses
from app.services.paper_generator import generate_paper

router = APIRouter()


def _get_student(db: Session, user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.get("/exams")
def list_student_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    update_exam_statuses(db)
    student = _get_student(db, current_user)

    # Get IDs of exams already attempted
    attempted_exam_ids = {
        a.exam_id for a in db.query(ExamAttempt).filter(ExamAttempt.student_id == student.id).all()
    }

    now = datetime.utcnow()
    exams = db.query(Exam).filter(Exam.status.in_(["live", "scheduled"])).all()

    result = []
    for exam in exams:
        attempt = db.query(ExamAttempt).filter(
            ExamAttempt.student_id == student.id,
            ExamAttempt.exam_id == exam.id,
        ).first()

        result.append({
            "id": exam.id,
            "title": exam.title,
            "subject": exam.subject,
            "description": exam.description,
            "status": exam.status,
            "start_time": exam.start_time.isoformat(),
            "end_time": exam.end_time.isoformat(),
            "duration_minutes": exam.duration_minutes,
            "total_questions": exam.total_questions,
            "marks_per_question": exam.marks_per_question,
            "negative_marking": exam.negative_marking,
            "passing_percentage": exam.passing_percentage,
            "attempted": exam.id in attempted_exam_ids,
            "attempt_id": attempt.id if attempt else None,
            "attempt_status": attempt.status if attempt else None,
        })

    return result


@router.get("/exams/{exam_id}/instructions")
def exam_instructions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    update_exam_statuses(db)
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.status not in ("live", "scheduled"):
        raise HTTPException(status_code=400, detail="Exam is not available")

    student = _get_student(db, current_user)
    attempt = db.query(ExamAttempt).filter(
        ExamAttempt.student_id == student.id, ExamAttempt.exam_id == exam_id
    ).first()

    return {
        "id": exam.id,
        "title": exam.title,
        "subject": exam.subject,
        "description": exam.description,
        "status": exam.status,
        "start_time": exam.start_time.isoformat(),
        "end_time": exam.end_time.isoformat(),
        "duration_minutes": exam.duration_minutes,
        "total_questions": exam.total_questions,
        "marks_per_question": exam.marks_per_question,
        "negative_marking": exam.negative_marking,
        "passing_percentage": exam.passing_percentage,
        "max_violations": exam.max_violations,
        "max_marks": exam.total_questions * exam.marks_per_question,
        "already_attempted": attempt is not None,
        "attempt_id": attempt.id if attempt else None,
        "attempt_status": attempt.status if attempt else None,
    }


@router.post("/exams/{exam_id}/start")
def start_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    update_exam_statuses(db)
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.status != "live":
        raise HTTPException(
            status_code=400,
            detail=f"Exam is not live. Current status: {exam.status}"
        )

    now = datetime.utcnow()
    if now > exam.end_time:
        raise HTTPException(status_code=400, detail="Exam time window has passed")

    student = _get_student(db, current_user)

    # Check for existing attempt
    existing = db.query(ExamAttempt).filter(
        ExamAttempt.student_id == student.id, ExamAttempt.exam_id == exam_id
    ).first()
    if existing:
        if existing.status in ("submitted", "timed_out"):
            raise HTTPException(status_code=400, detail="You have already submitted this exam")
        # Resume existing attempt
        return {"attempt_id": existing.id, "resumed": True}

    # Generate unique paper
    paper = generate_paper(db, exam)

    from datetime import timedelta
    server_deadline = now + timedelta(minutes=exam.duration_minutes)
    # Don't exceed exam end_time
    if server_deadline > exam.end_time:
        server_deadline = exam.end_time

    attempt = ExamAttempt(
        student_id=student.id,
        exam_id=exam_id,
        started_at=now,
        status="in_progress",
        violations_count=0,
        paper=paper,
        server_deadline=server_deadline,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {"attempt_id": attempt.id, "resumed": False}


@router.get("/dashboard")
def student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    update_exam_statuses(db)
    student = _get_student(db, current_user)

    # Available (live) exams
    live_exams = db.query(Exam).filter(Exam.status == "live").all()
    # Upcoming (scheduled) exams
    upcoming_exams = db.query(Exam).filter(Exam.status == "scheduled").all()
    # Past attempts with results
    attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.student_id == student.id, ExamAttempt.status.in_(["submitted", "timed_out"]))
        .order_by(ExamAttempt.submitted_at.desc())
        .limit(10)
        .all()
    )

    past_results = []
    for a in attempts:
        if a.result:
            past_results.append({
                "attempt_id": a.id,
                "exam_title": a.exam.title if a.exam else "Unknown",
                "subject": a.exam.subject if a.exam else "",
                "percentage": a.result.percentage,
                "total_marks": a.result.total_marks,
                "max_marks": a.result.max_marks,
                "passed": a.result.passed,
                "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
            })

    attempted_ids = {a.exam_id for a in db.query(ExamAttempt).filter(ExamAttempt.student_id == student.id).all()}

    stats = {
        "exams_taken": len(attempts),
        "avg_score": round(
            sum(a.result.percentage for a in attempts if a.result) / len(attempts), 1
        ) if attempts else 0,
        "best_score": round(
            max((a.result.percentage for a in attempts if a.result), default=0), 1
        ),
        "upcoming_count": len(upcoming_exams),
    }

    return {
        "student": {
            "name": student.name,
            "reg_number": student.reg_number,
            "student_class": student.student_class,
            "section": student.section,
        },
        "stats": stats,
        "available_exams": [
            {
                "id": e.id,
                "title": e.title,
                "subject": e.subject,
                "duration_minutes": e.duration_minutes,
                "total_questions": e.total_questions,
                "end_time": e.end_time.isoformat(),
                "attempted": e.id in attempted_ids,
            }
            for e in live_exams
        ],
        "upcoming_exams": [
            {
                "id": e.id,
                "title": e.title,
                "subject": e.subject,
                "start_time": e.start_time.isoformat(),
                "duration_minutes": e.duration_minutes,
            }
            for e in upcoming_exams[:5]
        ],
        "recent_results": past_results,
    }
