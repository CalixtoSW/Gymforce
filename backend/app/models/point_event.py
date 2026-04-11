import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class PointActionType(str, enum.Enum):  # noqa: UP042
    CHECKIN = "checkin"
    WORKOUT_COMPLETE = "workout_complete"
    STREAK_BONUS_7 = "streak_bonus_7"
    STREAK_BONUS_30 = "streak_bonus_30"
    TIER_PROMOTION = "tier_promotion"
    REFERRAL = "referral"
    CHALLENGE = "challenge"
    REDEMPTION = "redemption"
    ADMIN_ADJUSTMENT = "admin_adjustment"


class PointEvent(Base, UUIDMixin):
    __tablename__ = "point_events"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    action_type: Mapped[PointActionType] = mapped_column(Enum(PointActionType))
    points: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(String(255))
    ref_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    user = relationship("User", backref="point_events")
