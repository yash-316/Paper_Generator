"""
JWT creation, verification, and FastAPI dependency helpers.

Token payload structure:
    {
        "sub": <user_email>,
        "role": <role>,
        "user_id": <int>,
        "exp": <timestamp>
    }
"""
import os
from datetime import datetime, timedelta
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User

load_dotenv()

SECRET_KEY: str = os.getenv("SECRET_KEY", "changeme-at-least-32-chars-long-xyz")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---------------------------------------------------------------------------
# Token creation
# ---------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create and return a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# Token verification
# ---------------------------------------------------------------------------

def verify_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    Raises HTTP 401 if the token is invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that returns the currently authenticated User.
    Raises HTTP 401 if the token is missing, invalid, or the user is deactivated.
    """
    payload = verify_token(token)
    email: str = payload.get("sub", "")
    user: User | None = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return user


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """
    Dependency that allows only 'admin' or 'teacher' roles.
    Raises HTTP 403 for any other role.
    """
    if current_user.role not in ("admin", "teacher"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions — admin or teacher role required",
        )
    return current_user


def require_student(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """
    Dependency that allows only the 'student' role.
    Raises HTTP 403 for any other role.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions — student role required",
        )
    return current_user
