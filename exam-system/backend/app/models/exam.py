"""
Exam model — represents a timed online examination.
"""
from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, JSON
)
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    title = Column(String(300), nullable=False)
    subject = Column(String(100), nullable=False)
    description = Column(Text)
    status = Column(String(30), default="draft", nullable=False)
    # Scheduling
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    # Marking
    total_questions = Column(Integer, nullable=False)
    marks_per_question = Column(Float, default=1.0, nullable=False)
    negative_marking = Column(Float, default=0.0, nullable=False)
    passing_percentage = Column(Float, default=40.0, nullable=False)
    # Question selection strategy (mutually exclusive; difficulty takes priority)
    difficulty_distribution = Column(JSON, nullable=True)   # {"easy": N, "medium": N, "hard": N}
    topic_distribution = Column(JSON, nullable=True)        # {"topic_name": N, ...}
    # Result visibility
    show_result_immediately = Column(Boolean, default=True, nullable=False)
    show_correct_answers = Column(Boolean, default=False, nullable=False)
    show_explanations = Column(Boolean, default=False, nullable=False)
    leaderboard_enabled = Column(Boolean, default=False, nullable=False)
    max_violations = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    teacher = relationship("Teacher", back_populates="exams")
    attempts = relationship("ExamAttempt", back_populates="exam")
