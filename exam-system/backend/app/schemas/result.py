"""
Result Pydantic schemas.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class AnswerDetail(BaseModel):
    question_id: int
    question_text: str
    selected_option: Optional[str]
    correct_option: Optional[str]      # Only if show_correct_answers
    explanation: Optional[str]         # Only if show_explanations
    is_correct: bool


class ResultOut(BaseModel):
    id: int
    attempt_id: int
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    total_marks: float
    max_marks: float
    percentage: float
    accuracy: float
    passed: bool
    time_taken_seconds: int
    calculated_at: datetime
    # Conditional details based on exam visibility settings
    answer_details: Optional[List[AnswerDetail]] = None

    model_config = {"from_attributes": True}


class AdminResultRow(BaseModel):
    attempt_id: int
    student_name: str
    reg_number: str
    exam_title: str
    exam_subject: str
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    total_marks: float
    max_marks: float
    percentage: float
    accuracy: float
    passed: bool
    time_taken_seconds: int
    status: str
    submitted_at: Optional[datetime]

    model_config = {"from_attributes": True}
