"""
Questions routes — CRUD + CSV/Excel bulk upload.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.jwt import get_current_user, require_admin
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionOut, UploadResult
from app.services import question_service

router = APIRouter()


@router.get("")
def list_questions(
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    items, total = question_service.get_questions(db, subject, topic, difficulty, search, skip, limit)
    return {
        "items": [_question_out(q) for q in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("", status_code=201)
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = question_service.create_question(db, data, current_user.id)
    return _question_out(q)


@router.get("/{question_id}")
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = question_service.get_question_by_id(db, question_id)
    return _question_out(q)


@router.put("/{question_id}")
def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = question_service.update_question(db, question_id, data)
    return _question_out(q)


@router.delete("/{question_id}", status_code=204)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    question_service.delete_question(db, question_id)


@router.post("/upload", response_model=UploadResult)
async def upload_questions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Upload CSV or Excel file — returns preview with valid and invalid rows."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    allowed = (".csv", ".xlsx", ".xls")
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")

    content = await file.read()
    return question_service.upload_questions_from_file(db, content, file.filename, current_user.id)


@router.post("/upload/confirm")
def confirm_upload(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Import the pre-validated batch of questions."""
    valid_questions = payload.get("valid_questions", [])
    if not valid_questions:
        raise HTTPException(status_code=400, detail="No valid questions to import")
    # Attach created_by
    for q in valid_questions:
        q["created_by"] = current_user.id
    count = question_service.confirm_upload(db, valid_questions)
    return {"imported": count, "message": f"Successfully imported {count} questions"}


def _question_out(q) -> dict:
    return {
        "id": q.id,
        "subject": q.subject,
        "chapter": q.chapter,
        "topic": q.topic,
        "difficulty": q.difficulty,
        "question_text": q.question_text,
        "option_a": q.option_a,
        "option_b": q.option_b,
        "option_c": q.option_c,
        "option_d": q.option_d,
        "correct_answer": q.correct_answer,
        "marks": q.marks,
        "explanation": q.explanation,
        "is_active": q.is_active,
        "created_at": q.created_at.isoformat() if q.created_at else None,
    }
