import enum

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class ReferralStatus(str, enum.Enum):  # noqa: UP042
    PENDING = 'pending'
    REGISTERED = 'registered'
    ACTIVATED = 'activated'


class Referral(Base, UUIDMixin, TimestampMixin):
    __tablename__ = 'referrals'

    referrer_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    referral_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    referred_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    referred_user_id: Mapped[str | None] = mapped_column(
        ForeignKey('users.id'),
        nullable=True,
    )
    status: Mapped[ReferralStatus] = mapped_column(
        Enum(ReferralStatus),
        default=ReferralStatus.PENDING,
    )

    referrer = relationship('User', foreign_keys=[referrer_id], backref='referrals_sent')
    referred = relationship('User', foreign_keys=[referred_user_id])
