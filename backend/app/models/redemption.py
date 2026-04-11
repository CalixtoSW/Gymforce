import enum

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class RedemptionStatus(str, enum.Enum):  # noqa: UP042
    PENDING = 'pending'
    DELIVERED = 'delivered'
    CANCELLED = 'cancelled'


class Redemption(Base, UUIDMixin, TimestampMixin):
    __tablename__ = 'redemptions'

    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    reward_id: Mapped[str] = mapped_column(ForeignKey('rewards.id'))
    points_spent: Mapped[int] = mapped_column(Integer)
    status: Mapped[RedemptionStatus] = mapped_column(
        Enum(RedemptionStatus), default=RedemptionStatus.PENDING
    )
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user = relationship('User', backref='redemptions')
    reward = relationship('Reward')
