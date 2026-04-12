import enum
from datetime import date

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class ChallengeGoalType(str, enum.Enum):  # noqa: UP042
    CHECKINS = 'checkins'
    WORKOUTS = 'workouts'
    POINTS = 'points'
    STREAK = 'streak'


class Challenge(Base, UUIDMixin, TimestampMixin):
    __tablename__ = 'challenges'

    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    goal_type: Mapped[ChallengeGoalType] = mapped_column(Enum(ChallengeGoalType))
    goal_value: Mapped[int] = mapped_column(Integer)
    reward_points: Mapped[int] = mapped_column(Integer)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    icon: Mapped[str] = mapped_column(String(10), default='🎯')

    participants = relationship('UserChallenge', back_populates='challenge')


class UserChallenge(Base, UUIDMixin, TimestampMixin):
    __tablename__ = 'user_challenges'

    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    challenge_id: Mapped[str] = mapped_column(ForeignKey('challenges.id'), index=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[date | None] = mapped_column(Date, nullable=True)

    user = relationship('User', backref='challenges_joined')
    challenge = relationship('Challenge', back_populates='participants')
