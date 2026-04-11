from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class UserStreak(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_streaks"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    freeze_available: Mapped[bool] = mapped_column(Boolean, default=True)
    freeze_used_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    user = relationship("User", backref="streak_data")
