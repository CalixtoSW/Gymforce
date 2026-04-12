from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class PushToken(Base, UUIDMixin, TimestampMixin):
    __tablename__ = 'push_tokens'
    __table_args__ = (UniqueConstraint('user_id', 'token', name='uq_user_push_token'),)

    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    token: Mapped[str] = mapped_column(String(255))
    device_type: Mapped[str] = mapped_column(String(10), default='unknown')

    user = relationship('User', backref='push_tokens')
