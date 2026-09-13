"""
Exam service — CRUD and status lifecycle management.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.exam import Exam
from app.models.teacher import Teacher
from app.schemas.exam import ExamCreate, ExamUpdate


def _get_exam_or_404(db: Session, exam_id: int) -> Exam:
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


def get_exams(
    db: Session,
    status: Optional[str] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    q = db.query(Exam)
    if status:
        q = q.filter(Exam.status == status)
    if subject:
        q = q.filter(Exam.subject.ilike(f"%{subject}%"))
    if search:
        q = q.filter(Exam.title.ilike(f"%{search}%"))
    total = q.count()
    items = q.order_by(Exam.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_exam_by_id(db: Session, exam_id: int) -> Exam:
    return _get_exam_or_404(db, exam_id)


def create_exam(db: Session, data: ExamCreate, teacher_id: int) -> Exam:
    exam = Exam(
        teacher_id=teacher_id,
        title=data.title,
        subject=data.subject,
        description=data.description,
        status="draft",
        start_time=data.start_time,
        end_time=data.end_time,
        duration_minutes=data.duration_minutes,
        total_questions=data.total_questions,
        marks_per_question=data.marks_per_question,
        negative_marking=data.negative_marking,
        passing_percentage=data.passing_percentage,
        difficulty_distribution=data.difficulty_distribution,
        topic_distribution=data.topic_distribution,
        show_result_immediately=data.show_result_immediately,
        show_correct_answers=data.show_correct_answers,
        show_explanations=data.show_explanations,
        leaderboard_enabled=data.leaderboard_enabled,
        max_violations=data.max_violations,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


def update_exam(db: Session, exam_id: int, data: ExamUpdate) -> Exam:
    exam = _get_exam_or_404(db, exam_id)
    if exam.status not in ("draft", "scheduled"):
        raise HTTPException(
            status_code=400,
            detail="Only draft or scheduled exams can be edited"
        )
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)
    db.commit()
    db.refresh(exam)
    return exam


def delete_exam(db: Session, exam_id: int) -> None:
    exam = _get_exam_or_404(db, exam_id)
    if exam.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft exams can be deleted")
    db.delete(exam)
    db.commit()


def update_exam_statuses(db: Session) -> None:
    """
    Auto-transition exam statuses based on current time.
    draft → scheduled  (if start_time is in the future and exam has been configured)
    scheduled → live   (if now >= start_time)
    live → completed   (if now >= end_time)
    """
    now = datetime.utcnow()
    exams = db.query(Exam).filter(Exam.status.in_(["draft", "scheduled", "live"])).all()
    for exam in exams:
        if exam.status == "draft" and exam.start_time > now:
            exam.status = "scheduled"
        elif exam.status in ("draft", "scheduled") and exam.start_time <= now <= exam.end_time:
            exam.status = "live"
        elif exam.status == "live" and now > exam.end_time:
            exam.status = "completed"
    db.commit()


def get_exam_attempt_count(db: Session, exam_id: int) -> int:
    from app.models.attempt import ExamAttempt
    return db.query(ExamAttempt).filter(ExamAttempt.exam_id == exam_id).count()
