"""
Admin Dashboard routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.auth.jwt import require_admin
from app.models.user import User
from app.models.student import Student
from app.models.exam import Exam
from app.models.question import Question
from app.models.attempt import ExamAttempt
from app.models.result import Result

router = APIRouter()


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_students = db.query(Student).count()
    total_exams = db.query(Exam).count()
    total_questions = db.query(Question).filter(Question.is_active == True).count()
    active_exams = db.query(Exam).filter(Exam.status == "live").count()
    completed_attempts = db.query(ExamAttempt).filter(
        ExamAttempt.status.in_(["submitted", "timed_out"])
    ).count()

    avg_score_row = db.query(func.avg(Result.percentage)).scalar()
    avg_score = round(float(avg_score_row), 1) if avg_score_row else 0.0

    # Pass/fail counts
    pass_count = db.query(Result).filter(Result.passed == True).count()
    fail_count = db.query(Result).filter(Result.passed == False).count()

    # Exam participation — top 5 exams by attempts
    exam_participation = []
    exams = db.query(Exam).limit(10).all()
    for exam in exams:
        count = db.query(ExamAttempt).filter(ExamAttempt.exam_id == exam.id).count()
        avg = db.query(func.avg(Result.percentage)).join(
            ExamAttempt, ExamAttempt.id == Result.attempt_id
        ).filter(ExamAttempt.exam_id == exam.id).scalar()
        exam_participation.append({
            "exam_id": exam.id,
            "title": exam.title[:30],
            "attempts": count,
            "avg_score": round(float(avg), 1) if avg else 0.0,
        })

    # Questions by difficulty
    difficulty_dist = []
    for diff in ["easy", "medium", "hard"]:
        count = db.query(Question).filter(
            Question.difficulty == diff, Question.is_active == True
        ).count()
        difficulty_dist.append({"difficulty": diff, "count": count})

    # Recent attempts
    recent_attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.status.in_(["submitted", "timed_out"]))
        .order_by(ExamAttempt.submitted_at.desc())
        .limit(5)
        .all()
    )
    recent = []
    for a in recent_attempts:
        result = a.result
        recent.append({
            "student_name": a.student.name if a.student else "Unknown",
            "exam_title": a.exam.title if a.exam else "Unknown",
            "percentage": result.percentage if result else 0,
            "passed": result.passed if result else False,
            "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
        })

    return {
        "total_students": total_students,
        "total_exams": total_exams,
        "total_questions": total_questions,
        "active_exams": active_exams,
        "completed_attempts": completed_attempts,
        "avg_score": avg_score,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "exam_participation": exam_participation,
        "difficulty_distribution": difficulty_dist,
        "recent_attempts": recent,
    }
