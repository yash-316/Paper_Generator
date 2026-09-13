"""
Student service — CRUD and bulk-import operations.
"""
from __future__ import annotations
import io
from typing import Optional

import pandas as pd
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.hashing import hash_password
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentImportResult, StudentUpdate


# ---------------------------------------------------------------------------
# Listing
# ---------------------------------------------------------------------------

def get_students(
    db: Session,
    search: Optional[str] = None,
    class_: Optional[str] = None,
    section: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20,
) -> dict:
    query = db.query(Student).join(User, Student.user_id == User.id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            Student.name.ilike(like) | Student.reg_number.ilike(like) | Student.email.ilike(like)
        )
    if class_:
        query = query.filter(Student.student_class == class_)
    if section:
        query = query.filter(Student.section == section)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    page = skip // limit + 1 if limit else 1
    pages = (total + limit - 1) // limit if limit else 1
    return {"items": items, "total": total, "page": page, "pages": pages}


# ---------------------------------------------------------------------------
# Single-record operations
# ---------------------------------------------------------------------------

def get_student_by_id(db: Session, student_id: int) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


def create_student(db: Session, student_create: StudentCreate) -> Student:
    # Check for duplicate reg_number
    if db.query(Student).filter(Student.reg_number == student_create.reg_number).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Registration number '{student_create.reg_number}' already exists",
        )
    # Check for duplicate email (if provided)
    email = student_create.email or f"{student_create.reg_number}@exam.local"
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{email}' already in use",
        )

    user = User(
        email=email,
        hashed_password=hash_password(student_create.password),
        role="student",
        is_active=True,
    )
    db.add(user)
    db.flush()

    student = Student(
        user_id=user.id,
        reg_number=student_create.reg_number,
        name=student_create.name,
        email=student_create.email,
        student_class=student_create.student_class,
        section=student_create.section,
        roll_number=student_create.roll_number,
        phone=student_create.phone,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def update_student(db: Session, student_id: int, student_update: StudentUpdate) -> Student:
    student = get_student_by_id(db, student_id)
    update_data = student_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


def toggle_student_status(db: Session, student_id: int) -> tuple:
    student = get_student_by_id(db, student_id)
    user = student.user
    user.is_active = not user.is_active
    db.commit()
    db.refresh(student)
    return student, user.is_active


def get_student_performance(db: Session, student_id: int) -> dict:
    from app.models.attempt import ExamAttempt
    from app.models.result import Result

    student = get_student_by_id(db, student_id)
    attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.student_id == student_id, ExamAttempt.status.in_(["submitted", "timed_out"]))
        .all()
    )

    history = []
    for a in attempts:
        if a.result:
            history.append({
                "attempt_id": a.id,
                "exam_title": a.exam.title if a.exam else "",
                "subject": a.exam.subject if a.exam else "",
                "percentage": a.result.percentage,
                "total_marks": a.result.total_marks,
                "max_marks": a.result.max_marks,
                "passed": a.result.passed,
                "time_taken_seconds": a.result.time_taken_seconds,
                "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
            })

    avg = round(sum(h["percentage"] for h in history) / len(history), 1) if history else 0
    return {
        "student_id": student_id,
        "name": student.name,
        "reg_number": student.reg_number,
        "total_exams": len(history),
        "avg_score": avg,
        "history": history,
    }


def delete_student(db: Session, student_id: int) -> None:
    student = get_student_by_id(db, student_id)
    user = student.user
    db.delete(student)
    db.delete(user)
    db.commit()


# ---------------------------------------------------------------------------
# Bulk import from CSV / Excel
# ---------------------------------------------------------------------------

REQUIRED_IMPORT_COLS = {"reg_number", "name", "password"}


def import_students_from_csv(db: Session, file_bytes: bytes, filename: str) -> StudentImportResult:
    """
    Parse a CSV or Excel upload, validate rows, and create students.
    Returns a result summary with success/fail counts and per-row error details.
    """
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes), dtype=str)
        else:
            df = pd.read_excel(io.BytesIO(file_bytes), dtype=str)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not parse file: {exc}",
        )

    # Normalise column names
    df.columns = [c.strip().lower() for c in df.columns]
    missing_cols = REQUIRED_IMPORT_COLS - set(df.columns)
    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required columns: {missing_cols}",
        )

    df = df.fillna("")

    success_count = 0
    failed_count = 0
    errors: list[dict] = []

    for row_idx, row in df.iterrows():
        row_num = int(row_idx) + 2  # 1-indexed with header

        reg_number = str(row.get("reg_number", "")).strip()
        name = str(row.get("name", "")).strip()
        password = str(row.get("password", "")).strip()

        # Basic validation
        if not reg_number:
            errors.append({"row": row_num, "reason": "reg_number is empty"})
            failed_count += 1
            continue
        if not name:
            errors.append({"row": row_num, "reg_number": reg_number, "reason": "name is empty"})
            failed_count += 1
            continue
        if not password:
            errors.append({"row": row_num, "reg_number": reg_number, "reason": "password is empty"})
            failed_count += 1
            continue

        # Duplicate check
        if db.query(Student).filter(Student.reg_number == reg_number).first():
            errors.append({"row": row_num, "reg_number": reg_number, "reason": "reg_number already exists"})
            failed_count += 1
            continue

        email_val = str(row.get("email", "")).strip() or f"{reg_number}@exam.local"
        if db.query(User).filter(User.email == email_val).first():
            errors.append({"row": row_num, "reg_number": reg_number, "reason": f"email '{email_val}' already in use"})
            failed_count += 1
            continue

        try:
            user = User(
                email=email_val,
                hashed_password=hash_password(password),
                role="student",
                is_active=True,
            )
            db.add(user)
            db.flush()

            student = Student(
                user_id=user.id,
                reg_number=reg_number,
                name=name,
                email=str(row.get("email", "")).strip() or None,
                student_class=str(row.get("student_class", "")).strip() or None,
                section=str(row.get("section", "")).strip() or None,
                roll_number=str(row.get("roll_number", "")).strip() or None,
                phone=str(row.get("phone", "")).strip() or None,
            )
            db.add(student)
            db.flush()
            success_count += 1
        except Exception as exc:
            db.rollback()
            errors.append({"row": row_num, "reg_number": reg_number, "reason": str(exc)})
            failed_count += 1

    db.commit()
    return StudentImportResult(success_count=success_count, failed_count=failed_count, errors=errors)
