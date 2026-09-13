"""
Authentication Pydantic schemas.
"""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    identifier: str   # email OR student reg_number
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    user: dict | None = None


class UserOut(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
