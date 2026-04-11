from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class WorkoutSheet(Base, UUIDMixin, TimestampMixin):
    """Ficha de treino montada pelo personal."""

    __tablename__ = "workout_sheets"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    owner = relationship("User", foreign_keys=[user_id], backref="workout_sheets")
    creator = relationship("User", foreign_keys=[created_by])
    exercises = relationship(
        "Exercise",
        back_populates="sheet",
        order_by="Exercise.order",
    )


class Exercise(Base, UUIDMixin):
    """Exercício dentro de uma ficha."""

    __tablename__ = "exercises"

    sheet_id: Mapped[str] = mapped_column(ForeignKey("workout_sheets.id"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    sets: Mapped[int] = mapped_column(Integer)
    reps: Mapped[str] = mapped_column(String(20))
    rest_seconds: Mapped[int] = mapped_column(Integer, default=60)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    sheet = relationship("WorkoutSheet", back_populates="exercises")


class Workout(Base, UUIDMixin):
    """Registro de um treino realizado pelo aluno."""

    __tablename__ = "workouts"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    sheet_id: Mapped[str] = mapped_column(ForeignKey("workout_sheets.id"))
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    points_earned: Mapped[int] = mapped_column(Integer, default=0)

    user = relationship("User", backref="workouts")
    sheet = relationship("WorkoutSheet")
