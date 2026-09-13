"""
Student model — extends User with academic profile.
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    reg_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255))
    student_class = Column(String(50))
    section = Column(String(20))
    roll_number = Column(String(50))
    phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student")
    attempts = relationship("ExamAttempt", back_populates="student")
