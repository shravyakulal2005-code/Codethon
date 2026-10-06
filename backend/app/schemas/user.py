"""Pydantic v2 schemas for User and Auth endpoints."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Payload for POST /auth/register."""

    name: str = Field(..., min_length=2, max_length=120, examples=["Alice"])
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Require at least one digit and one letter."""
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter.")
        return v


class LoginRequest(BaseModel):
    """Payload for POST /auth/login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


# ── User ──────────────────────────────────────────────────────────────────────

class UserRead(BaseModel):
    """Public user representation."""

    id: int
    name: str
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Payload for PUT /users/me."""

    name: str | None = Field(None, min_length=2, max_length=120)
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=8, max_length=128)
