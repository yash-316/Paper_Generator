"""
Notification service — in-app notification management.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.notification import Notification
from app.models.user import User


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
) -> Notification:
    n = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def get_user_notifications(
    db: Session, user_id: int, unread_only: bool = False
) -> list[Notification]:
    q = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).limit(50).all()


def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
    n = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


def mark_all_read(db: Session, user_id: int) -> int:
    count = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .update({"is_read": True})
    )
    db.commit()
    return count


def notify_students_new_exam(db: Session, exam) -> None:
    """Notify all active student users about a new exam."""
    from app.models.student import Student
    students = (
        db.query(Student)
        .join(User, User.id == Student.user_id)
        .filter(User.is_active == True)
        .all()
    )
    for student in students:
        create_notification(
            db,
            user_id=student.user_id,
            title=f"New Exam Available: {exam.title}",
            message=f"A new exam '{exam.title}' for {exam.subject} has been scheduled. "
                    f"It starts on {exam.start_time.strftime('%d %b %Y at %H:%M')}.",
            notification_type="info",
        )


def notify_teacher_submission(db: Session, exam, student_name: str) -> None:
    """Notify the exam teacher that a student submitted."""
    create_notification(
        db,
        user_id=exam.teacher.user_id,
        title=f"Exam Submitted: {exam.title}",
        message=f"{student_name} has submitted '{exam.title}'.",
        notification_type="info",
    )
