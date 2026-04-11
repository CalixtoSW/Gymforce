from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class Checkin(Base, UUIDMixin):
    __tablename__ = "checkins"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    checked_out_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    points_earned: Mapped[int] = mapped_column(Integer, default=0)

    user = relationship("User", backref="checkins")
