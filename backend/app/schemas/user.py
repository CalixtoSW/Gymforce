from pydantic import BaseModel, EmailStr

from app.models.user import UserRole, UserTier


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    cpf: str | None
    phone: str | None
    avatar_url: str | None
    role: UserRole
    tier: UserTier
    total_points: int
    current_points: int
    streak_count: int
    is_active: bool

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class UserAdminUpdate(BaseModel):
    """Admin pode alterar role e is_active."""

    name: str | None = None
    phone: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
