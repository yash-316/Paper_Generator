"""
Database connection setup — SQLAlchemy engine, session factory, Base, and helper utilities.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import QueuePool

load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://examuser:exampass@localhost:5432/examdb")


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,          # Reconnect on stale connections
        pool_recycle=1800,           # Recycle connections every 30 min
        echo=False,                  # Set True to log SQL queries during dev
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    """FastAPI dependency — yields a SQLAlchemy session and ensures it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables() -> None:
    """Import all models then create tables if they don't already exist."""
    # Side-effect imports so SQLAlchemy knows about every model before create_all
    from app.models import (  # noqa: F401
        user, student, teacher, exam, question, attempt, result, notification
    )
    Base.metadata.create_all(bind=engine)


def check_db_connection() -> bool:
    """Returns True if a basic SELECT 1 succeeds, False otherwise."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
