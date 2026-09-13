"""
Password hashing utilities using native bcrypt.
"""
import bcrypt


def hash_password(password: str) -> str:
    """Return the bcrypt hash of a plain-text password."""
    # Truncate to 72 bytes to adhere to bcrypt standard limit safely
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches the stored *hashed* value."""
    try:
        pwd_bytes = plain.encode("utf-8")[:72]
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False
