from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Assessment(Base, UUIDMixin, TimestampMixin):
    """Snapshot de avaliação física — imutável após criação."""

    __tablename__ = 'assessments'

    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    assessed_by: Mapped[str] = mapped_column(ForeignKey('users.id'))
    assessment_date: Mapped[date] = mapped_column(Date)

    weight_kg: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    body_fat_pct: Mapped[float | None] = mapped_column(Numeric(4, 1), nullable=True)
    muscle_mass_kg: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    chest_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    waist_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    hips_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    right_arm_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    left_arm_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    right_thigh_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    left_thigh_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    right_calf_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    left_calf_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship('User', foreign_keys=[user_id], backref='assessments')
    assessor = relationship('User', foreign_keys=[assessed_by])
