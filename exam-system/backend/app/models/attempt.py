"""
ExamAttempt and StudentAnswer models.

ExamAttempt stores the generated paper (with correct_mapped) in a JSON column.
correct_mapped MUST NEVER be sent to the student — strip it at the API layer.
"""
from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey,
    Integer, JSON, String, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database.connection import Base


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String(30), default="in_progress", nullable=False)
    # Possible statuses: in_progress, submitted, timed_out, flagged
    violations_count = Column(Integer, default=0, nullable=False)
    # Full paper: list of {question_id, question_text, options{A,B,C,D}, correct_mapped}
    paper = Column(JSON, nullable=False)
    # Enforced server-side deadline
    server_deadline = Column(DateTime, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="attempts")
    exam = relationship("Exam", back_populates="attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    result = relationship("Result", back_populates="attempt", uselist=False)


class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("exam_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option = Column(String(1), nullable=True)   # 'A','B','C','D' or NULL
    is_marked_review = Column(Boolean, default=False, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    attempt = relationship("ExamAttempt", back_populates="answers")

    __table_args__ = (
        UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question"),
    )
