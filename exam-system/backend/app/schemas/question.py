"""
Question Pydantic schemas.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class QuestionCreate(BaseModel):
    subject: str
    chapter: Optional[str] = None
    topic: Optional[str] = None
    difficulty: str = "medium"
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    marks: float = 1.0
    explanation: Optional[str] = None

    @field_validator("correct_answer")
    @classmethod
    def validate_correct_answer(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ("A", "B", "C", "D"):
            raise ValueError("correct_answer must be one of A, B, C, D")
        return v

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ("easy", "medium", "hard"):
            raise ValueError("difficulty must be one of: easy, medium, hard")
        return v

    @field_validator("question_text", "option_a", "option_b", "option_c", "option_d", "subject")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field must not be empty")
        return v.strip()


class QuestionUpdate(BaseModel):
    subject: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    marks: Optional[float] = None
    explanation: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("correct_answer")
    @classmethod
    def validate_correct_answer(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().upper()
        if v not in ("A", "B", "C", "D"):
            raise ValueError("correct_answer must be one of A, B, C, D")
        return v


class QuestionOut(BaseModel):
    id: int
    subject: str
    chapter: Optional[str] = None
    topic: Optional[str] = None
    difficulty: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    marks: float
    explanation: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}


class QuestionFilter(BaseModel):
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    search: Optional[str] = None


class UploadErrorRow(BaseModel):
    row: int
    question: str = ""
    errors: list[str]


class UploadResult(BaseModel):
    success_count: int
    failed_count: int
    errors: list[UploadErrorRow]
    valid_questions: list[dict] = []

