"""
Auth service — user authentication and first-admin bootstrapping.
"""
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app.auth.hashing import hash_password, verify_password
from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher
from app.schemas.student import StudentCreate

load_dotenv()


def authenticate_user(db: Session, identifier: str, password: str) -> User | None:
    """
    Try to find a user by email first; if not found, fall back to checking
    reg_number for student accounts.  Returns None if credentials don't match.
    """
    user: User | None = db.query(User).filter(User.email == identifier).first()

    if user is None:
        # Try reg_number lookup for students
        student: Student | None = (
            db.query(Student).filter(Student.reg_number == identifier).first()
        )
        if student:
            user = student.user

    if user is None:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user_and_student(db: Session, student_create: StudentCreate) -> tuple[User, Student]:
    """
    Create a User (role='student') and a linked Student profile in one transaction.
    """
    user = User(
        email=student_create.email or f"{student_create.reg_number}@exam.local",
        hashed_password=hash_password(student_create.password),
        role="student",
        is_active=True,
    )
    db.add(user)
    db.flush()   # get user.id

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
    db.refresh(user)
    db.refresh(student)
    return user, student


def create_admin_if_not_exists(db: Session) -> None:
    """
    Bootstrap the first admin account from environment variables if no admin exists yet.
    """
    admin_email: str = os.getenv("FIRST_ADMIN_EMAIL", "admin@school.com")
    admin_password: str = os.getenv("FIRST_ADMIN_PASSWORD", "Admin@123")

    existing: User | None = db.query(User).filter(User.email == admin_email).first()
    if existing:
        return

    admin = User(
        email=admin_email,
        hashed_password=hash_password(admin_password),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print(f"[seed] Created admin user: {admin_email}")
