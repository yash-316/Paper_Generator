"""
Admin Students routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.jwt import require_admin
from app.models.user import User
from app.schemas.student import StudentCreate, StudentUpdate
from app.services import student_service

router = APIRouter()


@router.get("")
def list_students(
    search: Optional[str] = Query(None),
    student_class: Optional[str] = Query(None, alias="class"),
    section: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    items, total = student_service.get_students(db, search, student_class, section, is_active, skip, limit)
    return {
        "items": [_student_out(s) for s in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("", status_code=201)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    s = student_service.create_student(db, data)
    return _student_out(s)


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    s = student_service.get_student_by_id(db, student_id)
    return _student_out(s)


@router.put("/{student_id}")
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    s = student_service.update_student(db, student_id, data)
    return _student_out(s)


@router.patch("/{student_id}/toggle")
def toggle_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    s, active = student_service.toggle_student_status(db, student_id)
    return {"message": f"Student {'enabled' if active else 'disabled'}", "is_active": active}


@router.delete("/{student_id}", status_code=204)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    student_service.delete_student(db, student_id)


@router.post("/import")
async def import_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    content = await file.read()
    result = student_service.import_students_from_csv(db, content, file.filename)
    return result


@router.get("/{student_id}/performance")
def student_performance(
    student_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return student_service.get_student_performance(db, student_id)


def _student_out(s) -> dict:
    return {
        "id": s.id,
        "user_id": s.user_id,
        "reg_number": s.reg_number,
        "name": s.name,
        "email": s.email,
        "student_class": s.student_class,
        "section": s.section,
        "roll_number": s.roll_number,
        "phone": s.phone,
        "is_active": s.user.is_active if s.user else True,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }
