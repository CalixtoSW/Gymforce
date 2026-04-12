import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class PaymentStatus(str, enum.Enum):  # noqa: UP042
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'
    REFUNDED = 'refunded'
    EXPIRED = 'expired'


class PaymentMethod(str, enum.Enum):  # noqa: UP042
    PIX = 'pix'
    CREDIT_CARD = 'credit_card'
    POINTS_DISCOUNT = 'points_discount'


class Payment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = 'payments'

    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    plan_id: Mapped[str] = mapped_column(ForeignKey('plans.id'))
    membership_id: Mapped[str | None] = mapped_column(
        ForeignKey('memberships.id'),
        nullable=True,
    )

    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    discount_points: Mapped[int] = mapped_column(Integer, default=0)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    final_amount: Mapped[float] = mapped_column(Numeric(10, 2))

    method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod))
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus),
        default=PaymentStatus.PENDING,
    )

    mp_payment_id: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )
    mp_qr_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    mp_qr_code_base64: Mapped[str | None] = mapped_column(Text, nullable=True)
    mp_ticket_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user = relationship('User', backref='payments')
    plan = relationship('Plan')
    membership = relationship('Membership', backref='payments')
