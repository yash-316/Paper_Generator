"""
Result model — computed scores for a completed exam attempt.
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("exam_attempts.id"), unique=True, nullable=False)
    correct_count = Column(Integer, default=0, nullable=False)
    incorrect_count = Column(Integer, default=0, nullable=False)
    unanswered_count = Column(Integer, default=0, nullable=False)
    total_marks = Column(Float, default=0.0, nullable=False)
    max_marks = Column(Float, default=0.0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    accuracy = Column(Float, default=0.0, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)
    time_taken_seconds = Column(Integer, default=0, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    attempt = relationship("ExamAttempt", back_populates="result")
