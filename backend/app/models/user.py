import enum

from sqlalchemy import Boolean, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class UserRole(str, enum.Enum):  # noqa: UP042
    ALUNO = "aluno"
    PERSONAL = "personal"
    ADMIN = "admin"
    RECEPCAO = "recepcao"


class UserTier(str, enum.Enum):  # noqa: UP042
    BRONZE = "bronze"
    PRATA = "prata"
    OURO = "ouro"
    DIAMANTE = "diamante"
    LENDA = "lenda"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    cpf: Mapped[str | None] = mapped_column(String(14), unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.ALUNO)
    tier: Mapped[UserTier] = mapped_column(Enum(UserTier), default=UserTier.BRONZE)
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    current_points: Mapped[int] = mapped_column(Integer, default=0)
    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
