"""
Exam Pydantic schemas.
"""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator


class ExamStatus(str, Enum):
    draft = "draft"
    scheduled = "scheduled"
    live = "live"
    completed = "completed"


class ExamCreate(BaseModel):
    title: str
    subject: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    total_questions: int
    marks_per_question: float = 1.0
    negative_marking: float = 0.0
    passing_percentage: float = 40.0
    difficulty_distribution: Optional[dict] = None
    topic_distribution: Optional[dict] = None
    show_result_immediately: bool = True
    show_correct_answers: bool = False
    show_explanations: bool = False
    leaderboard_enabled: bool = False
    max_violations: int = 3

    @field_validator("title", "subject")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field must not be empty")
        return v.strip()

    @field_validator("duration_minutes", "total_questions")
    @classmethod
    def positive_int(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Must be a positive integer")
        return v

    @field_validator("marks_per_question")
    @classmethod
    def positive_marks(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("marks_per_question must be positive")
        return v

    @field_validator("negative_marking")
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("negative_marking must be >= 0")
        return v

    @field_validator("passing_percentage")
    @classmethod
    def valid_percentage(cls, v: float) -> float:
        if not (0 <= v <= 100):
            raise ValueError("passing_percentage must be between 0 and 100")
        return v

    @model_validator(mode="after")
    def end_after_start(self) -> "ExamCreate":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    total_questions: Optional[int] = None
    marks_per_question: Optional[float] = None
    negative_marking: Optional[float] = None
    passing_percentage: Optional[float] = None
    difficulty_distribution: Optional[dict] = None
    topic_distribution: Optional[dict] = None
    show_result_immediately: Optional[bool] = None
    show_correct_answers: Optional[bool] = None
    show_explanations: Optional[bool] = None
    leaderboard_enabled: Optional[bool] = None
    max_violations: Optional[int] = None


class ExamOut(BaseModel):
    id: int
    title: str
    subject: str
    description: Optional[str] = None
    status: ExamStatus
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    total_questions: int
    marks_per_question: float
    negative_marking: float
    passing_percentage: float
    difficulty_distribution: Optional[dict] = None
    topic_distribution: Optional[dict] = None
    show_result_immediately: bool
    show_correct_answers: bool
    show_explanations: bool
    leaderboard_enabled: bool
    max_violations: int
    created_at: datetime
    teacher_name: Optional[str] = None
    attempt_count: int = 0

    model_config = {"from_attributes": True}
