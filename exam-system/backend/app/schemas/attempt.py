"""
Attempt Pydantic schemas.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class AttemptStart(BaseModel):
    exam_id: int


class AnswerSave(BaseModel):
    question_id: int
    selected_option: Optional[str] = None   # 'A','B','C','D' or None to clear
    is_marked_review: bool = False


class AttemptOut(BaseModel):
    """Attempt data sent to the student — correct_mapped is STRIPPED from paper."""
    id: int
    exam_id: int
    exam_title: str
    exam_subject: str
    duration_minutes: int
    started_at: datetime
    server_deadline: datetime
    status: str
    time_remaining_seconds: int
    # paper items without correct_mapped
    paper: List[dict]
    # current saved answers {question_id: {selected_option, is_marked_review}}
    answers: dict

    model_config = {"from_attributes": True}


class ViolationReport(BaseModel):
    violation_type: str   # e.g. 'tab_switch', 'copy_paste', 'fullscreen_exit'
