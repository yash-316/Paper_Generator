"""
Student Pydantic schemas.
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


class StudentCreate(BaseModel):
    reg_number: str
    name: str
    email: Optional[str] = None
    password: str
    student_class: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("reg_number", "name", "password")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field must not be empty")
        return v.strip()


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    student_class: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    phone: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    user_id: int
    reg_number: str
    name: str
    email: Optional[str] = None
    student_class: Optional[str] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class StudentImportResult(BaseModel):
    success_count: int
    failed_count: int
    errors: list[dict]
