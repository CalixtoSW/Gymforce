from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.redis import get_redis
from app.models.point_event import PointEvent
from app.models.streak import UserStreak
from app.models.user import User
from app.schemas.gamification import (
    GamificationSummary,
    LeaderboardResponse,
    PointEventResponse,
    StreakResponse,
)
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/summary", response_model=GamificationSummary)
async def get_my_summary(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GamificationSummary:
    result = await db.execute(select(UserStreak).where(UserStreak.user_id == user.id))
    streak_data = result.scalar_one_or_none()
    streak = StreakResponse(
        current_streak=streak_data.current_streak if streak_data else 0,
        longest_streak=streak_data.longest_streak if streak_data else 0,
        freeze_available=streak_data.freeze_available if streak_data else True,
        last_activity_date=(
            str(streak_data.last_activity_date)
            if streak_data and streak_data.last_activity_date
            else None
        ),
    )

    try:
        redis = await get_redis()
        rank = await GamificationService(db, redis).get_my_rank(user.id)
    except Exception:
        rank = None

    return GamificationSummary(
        total_points=user.total_points,
        current_points=user.current_points,
        tier=user.tier.value,
        streak=streak,
        rank=rank,
    )


@router.get("/points/history", response_model=list[PointEventResponse])
async def points_history(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[PointEventResponse]:
    result = await db.execute(
        select(PointEvent)
        .where(PointEvent.user_id == user.id)
        .order_by(PointEvent.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def leaderboard(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    limit: int = Query(10, ge=1, le=50),
) -> LeaderboardResponse:
    try:
        redis = await get_redis()
    except Exception:
        redis = None

    gamification = GamificationService(db, redis)
    entries = await gamification.get_leaderboard(limit=limit, month=month)
    my_rank = await gamification.get_my_rank(user.id, month=month)
    return LeaderboardResponse(leaderboard=entries, my_rank=my_rank)
