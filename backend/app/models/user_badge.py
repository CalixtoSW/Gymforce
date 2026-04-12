from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class UserBadge(Base, UUIDMixin):
    __tablename__ = 'user_badges'
    __table_args__ = (UniqueConstraint('user_id', 'badge_id', name='uq_user_badge'),)

    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    badge_id: Mapped[str] = mapped_column(ForeignKey('badges.id'))
    earned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user = relationship('User', backref='badges_earned')
    badge = relationship('Badge')
