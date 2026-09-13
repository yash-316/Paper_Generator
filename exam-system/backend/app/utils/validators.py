"""
Utility input sanitizers and validators.
"""
import re
from fastapi import HTTPException


def validate_correct_answer(answer: str) -> str:
    """Ensure answer is A, B, C, or D."""
    clean = answer.strip().upper()
    if clean not in ("A", "B", "C", "D"):
        raise HTTPException(
            status_code=422,
            detail=f"Invalid correct_answer '{answer}'. Must be one of A, B, C, D"
        )
    return clean


def sanitize_string(s: str, max_length: int = 255) -> str:
    """Strip whitespace and truncate string safely."""
    if not s:
        return ""
    clean = s.strip()
    return clean[:max_length]


def validate_file_extension(filename: str, allowed_extensions: tuple = (".csv", ".xlsx", ".xls")) -> bool:
    """Verify uploaded file matches allowed extensions."""
    if not filename:
        return False
    return filename.lower().endswith(allowed_extensions)
