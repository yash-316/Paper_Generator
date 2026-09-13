"""
Teacher model — extends User with department and employee info.
"""
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    department = Column(String(100))
    employee_id = Column(String(50), unique=True)

    # Relationships
    user = relationship("User", back_populates="teacher")
    exams = relationship("Exam", back_populates="teacher")
