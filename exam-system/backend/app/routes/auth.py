"""
Auth routes — login, me, logout.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.jwt import get_current_user, create_access_token
from app.services.auth_service import authenticate_user
from app.schemas.auth import LoginRequest, TokenResponse
from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.identifier, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Determine display name
    name = user.email
    if user.student:
        name = user.student.name
    elif user.teacher:
        name = user.teacher.name

    user_data = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "name": name,
    }
    if user.student:
        user_data["reg_number"] = user.student.reg_number
        user_data["student_class"] = user.student.student_class
        user_data["section"] = user.student.section
    elif user.teacher:
        user_data["department"] = user.teacher.department

    token = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        name=name,
        user=user_data,
    )


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile: dict = {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }
    if current_user.student:
        s = current_user.student
        profile["name"] = s.name
        profile["reg_number"] = s.reg_number
        profile["student_class"] = s.student_class
        profile["section"] = s.section
    elif current_user.teacher:
        t = current_user.teacher
        profile["name"] = t.name
        profile["department"] = t.department
    else:
        profile["name"] = current_user.email
    return profile


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
