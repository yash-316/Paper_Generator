"""
Admin Exams routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.jwt import require_admin
from app.models.user import User
from app.models.attempt import ExamAttempt
from app.schemas.exam import ExamCreate, ExamUpdate
from app.services import exam_service
from app.services.notification_service import notify_students_new_exam

router = APIRouter()


def _exam_out(exam, db: Session) -> dict:
    attempt_count = exam_service.get_exam_attempt_count(db, exam.id)
    return {
        "id": exam.id,
        "title": exam.title,
        "subject": exam.subject,
        "description": exam.description,
        "status": exam.status,
        "start_time": exam.start_time.isoformat() if exam.start_time else None,
        "end_time": exam.end_time.isoformat() if exam.end_time else None,
        "duration_minutes": exam.duration_minutes,
        "total_questions": exam.total_questions,
        "marks_per_question": exam.marks_per_question,
        "negative_marking": exam.negative_marking,
        "passing_percentage": exam.passing_percentage,
        "difficulty_distribution": exam.difficulty_distribution,
        "topic_distribution": exam.topic_distribution,
        "show_result_immediately": exam.show_result_immediately,
        "show_correct_answers": exam.show_correct_answers,
        "show_explanations": exam.show_explanations,
        "leaderboard_enabled": exam.leaderboard_enabled,
        "max_violations": exam.max_violations,
        "attempt_count": attempt_count,
        "teacher_name": exam.teacher.name if exam.teacher else None,
        "created_at": exam.created_at.isoformat() if exam.created_at else None,
    }


@router.get("")
def list_exams(
    status: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    from app.services.exam_service import update_exam_statuses
    update_exam_statuses(db)
    items, total = exam_service.get_exams(db, status, subject, search, skip, limit)
    return {
        "items": [_exam_out(e, db) for e in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("", status_code=201)
def create_exam(
    data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    from app.models.teacher import Teacher
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        # Admin without teacher profile — create a default one
        teacher = Teacher(user_id=current_user.id, name=current_user.email, department="Administration")
        db.add(teacher)
        db.commit()
        db.refresh(teacher)

    exam = exam_service.create_exam(db, data, teacher.id)
    notify_students_new_exam(db, exam)
    return _exam_out(exam, db)


@router.get("/{exam_id}")
def get_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    exam = exam_service.get_exam_by_id(db, exam_id)
    return _exam_out(exam, db)


@router.put("/{exam_id}")
def update_exam(
    exam_id: int,
    data: ExamUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    exam = exam_service.update_exam(db, exam_id, data)
    return _exam_out(exam, db)


@router.delete("/{exam_id}", status_code=204)
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    exam_service.delete_exam(db, exam_id)


@router.get("/{exam_id}/attempts")
def list_exam_attempts(
    exam_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    attempts = db.query(ExamAttempt).filter(ExamAttempt.exam_id == exam_id).all()
    return [
        {
            "id": a.id,
            "student_name": a.student.name if a.student else "Unknown",
            "reg_number": a.student.reg_number if a.student else "",
            "status": a.status,
            "started_at": a.started_at.isoformat() if a.started_at else None,
            "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
            "violations_count": a.violations_count,
        }
        for a in attempts
    ]
