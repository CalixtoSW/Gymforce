import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class SessionStatus(str, enum.Enum):  # noqa: UP042
    ACTIVE = 'active'
    PAUSED = 'paused'
    COMPLETED = 'completed'
    PARTIAL = 'partial'
    CANCELLED = 'cancelled'


class PartialReason(str, enum.Enum):  # noqa: UP042
    INJURY = 'injury'
    FATIGUE = 'fatigue'
    TIME_CONSTRAINT = 'time'
    EQUIPMENT_BUSY = 'equipment'
    FEELING_UNWELL = 'unwell'
    PERSONAL_DECISION = 'personal'
    OTHER = 'other'


class WorkoutSession(Base, UUIDMixin, TimestampMixin):
    __tablename__ = 'workout_sessions'

    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    sheet_id: Mapped[str] = mapped_column(ForeignKey('workout_sheets.id'))

    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus), default=SessionStatus.ACTIVE
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    paused_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_pause_seconds: Mapped[int] = mapped_column(Integer, default=0)

    active_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_sets_planned: Mapped[int] = mapped_column(Integer, default=0)
    total_sets_completed: Mapped[int] = mapped_column(Integer, default=0)
    total_sets_skipped: Mapped[int] = mapped_column(Integer, default=0)
    completion_pct: Mapped[int] = mapped_column(Integer, default=0)

    partial_reason: Mapped[PartialReason | None] = mapped_column(
        Enum(PartialReason), nullable=True
    )
    partial_notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    finished_by: Mapped[str | None] = mapped_column(
        ForeignKey('users.id'), nullable=True
    )

    points_earned: Mapped[int] = mapped_column(Integer, default=0)

    user = relationship('User', foreign_keys=[user_id], backref='workout_sessions')
    sheet = relationship('WorkoutSheet')
    finisher = relationship('User', foreign_keys=[finished_by])
    set_logs = relationship(
        'SetLog', back_populates='session', order_by='SetLog.created_at'
    )


class SetLogStatus(str, enum.Enum):  # noqa: UP042
    COMPLETED = 'completed'
    SKIPPED = 'skipped'
    PARTIAL = 'partial'
    FAILED = 'failed'


class SetLog(Base, UUIDMixin):
    __tablename__ = 'set_logs'

    session_id: Mapped[str] = mapped_column(
        ForeignKey('workout_sessions.id'), index=True
    )
    exercise_id: Mapped[str] = mapped_column(ForeignKey('exercises.id'))

    set_number: Mapped[int] = mapped_column(Integer)
    planned_reps: Mapped[str] = mapped_column(String(20))
    planned_weight_kg: Mapped[float | None] = mapped_column(
        Numeric(6, 2), nullable=True
    )

    actual_reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    actual_weight_kg: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    status: Mapped[SetLogStatus] = mapped_column(
        Enum(SetLogStatus), default=SetLogStatus.COMPLETED
    )

    rest_seconds_taken: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    session = relationship('WorkoutSession', back_populates='set_logs')
    exercise = relationship('Exercise')
