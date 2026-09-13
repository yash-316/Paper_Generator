"""
Notification Pydantic schemas.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: str = "info"   # info, warning, success


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
