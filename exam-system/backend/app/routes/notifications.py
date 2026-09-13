"""
Notifications routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.services.notification_service import (
    get_user_notifications, mark_as_read, mark_all_read
)

router = APIRouter()


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifs = get_user_notifications(db, current_user.id)
    unread_count = sum(1 for n in notifs if not n.is_read)
    return {
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.notification_type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifs
        ],
        "unread_count": unread_count,
    }


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = mark_as_read(db, notification_id, current_user.id)
    return {"id": n.id, "is_read": n.is_read}


@router.patch("/read-all")
def mark_all_read_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = mark_all_read(db, current_user.id)
    return {"marked_read": count}
