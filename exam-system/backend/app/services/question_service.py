"""
Question service — CRUD and CSV/Excel bulk upload with validation.
"""
import io
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionUpdate, UploadResult, UploadErrorRow


def get_questions(
    db: Session,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    q = db.query(Question).filter(Question.is_active == True)
    if subject:
        q = q.filter(Question.subject.ilike(f"%{subject}%"))
    if topic:
        q = q.filter(Question.topic.ilike(f"%{topic}%"))
    if difficulty:
        q = q.filter(Question.difficulty == difficulty.lower())
    if search:
        q = q.filter(Question.question_text.ilike(f"%{search}%"))
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return items, total


def get_question_by_id(db: Session, question_id: int) -> Question:
    q = db.query(Question).filter(Question.id == question_id, Question.is_active == True).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


def create_question(db: Session, data: QuestionCreate, user_id: int) -> Question:
    q = Question(
        subject=data.subject,
        chapter=data.chapter,
        topic=data.topic,
        difficulty=data.difficulty,
        question_text=data.question_text.strip(),
        option_a=data.option_a,
        option_b=data.option_b,
        option_c=data.option_c,
        option_d=data.option_d,
        correct_answer=data.correct_answer.upper(),
        marks=data.marks,
        explanation=data.explanation,
        created_by=user_id,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


def update_question(db: Session, question_id: int, data: QuestionUpdate) -> Question:
    q = get_question_by_id(db, question_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "correct_answer" and value:
            value = value.upper()
        setattr(q, field, value)
    db.commit()
    db.refresh(q)
    return q


def delete_question(db: Session, question_id: int) -> None:
    q = get_question_by_id(db, question_id)
    q.is_active = False
    db.commit()


def upload_questions_from_file(
    db: Session, file_bytes: bytes, filename: str, user_id: int
) -> UploadResult:
    """
    Parse CSV or Excel file, validate each row, return preview with valid/invalid lists.
    Does NOT import — call confirm_upload separately.
    """
    import pandas as pd

    errors: list[UploadErrorRow] = []
    valid_questions: list[dict] = []

    REQUIRED_COLS = {
        "question_text", "option_a", "option_b", "option_c",
        "option_d", "correct_answer", "subject", "difficulty"
    }

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes), dtype=str)
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_bytes), dtype=str)
        else:
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")

    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    missing_cols = REQUIRED_COLS - set(df.columns)
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing_cols))}"
        )

    # Collect existing question texts for duplicate detection
    existing_texts = {
        q.question_text.strip().lower()
        for q in db.query(Question.question_text).filter(Question.is_active == True).all()
    }
    seen_in_file: set[str] = set()

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # 1-based with header
        row = row.fillna("")

        def val(col: str) -> str:
            return str(row.get(col, "")).strip()

        question_text = val("question_text")
        option_a = val("option_a")
        option_b = val("option_b")
        option_c = val("option_c")
        option_d = val("option_d")
        correct_answer = val("correct_answer").upper()
        subject = val("subject")
        difficulty = val("difficulty").lower()
        chapter = val("chapter")
        topic = val("topic")
        marks_str = val("marks")
        explanation = val("explanation")

        row_errors = []

        if not question_text:
            row_errors.append("question_text is empty")
        if not option_a or not option_b or not option_c or not option_d:
            row_errors.append("One or more options (A/B/C/D) are empty")
        if correct_answer not in ("A", "B", "C", "D"):
            row_errors.append(f"correct_answer must be A/B/C/D, got '{correct_answer}'")
        if not subject:
            row_errors.append("subject is empty")
        if difficulty not in ("easy", "medium", "hard"):
            row_errors.append(f"difficulty must be easy/medium/hard, got '{difficulty}'")

        if question_text:
            key = question_text.lower()
            if key in existing_texts:
                row_errors.append("Duplicate question (already exists in database)")
            elif key in seen_in_file:
                row_errors.append("Duplicate question (appears multiple times in this file)")
            else:
                seen_in_file.add(key)

        try:
            marks = float(marks_str) if marks_str else 1.0
        except ValueError:
            marks = 1.0

        if row_errors:
            errors.append(UploadErrorRow(row=row_num, question=question_text[:80], errors=row_errors))
        else:
            valid_questions.append({
                "question_text": question_text,
                "option_a": option_a,
                "option_b": option_b,
                "option_c": option_c,
                "option_d": option_d,
                "correct_answer": correct_answer,
                "subject": subject,
                "chapter": chapter,
                "topic": topic,
                "difficulty": difficulty,
                "marks": marks,
                "explanation": explanation,
                "created_by": user_id,
            })

    return UploadResult(
        success_count=len(valid_questions),
        failed_count=len(errors),
        errors=errors,
        valid_questions=valid_questions,
    )


def confirm_upload(db: Session, valid_questions: list[dict]) -> int:
    """Insert pre-validated questions into the database."""
    for q_data in valid_questions:
        q = Question(**q_data)
        db.add(q)
    db.commit()
    return len(valid_questions)
