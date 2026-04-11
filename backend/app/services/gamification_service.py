from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, status
from redis.asyncio import Redis
from sqlalchemy import and_, extract, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.point_event import PointActionType, PointEvent
from app.models.streak import UserStreak
from app.models.user import User, UserTier
from app.repositories.user_repo import UserRepository

POINTS_CONFIG = {
    PointActionType.CHECKIN: 10,
    PointActionType.WORKOUT_COMPLETE: 25,
    PointActionType.STREAK_BONUS_7: 100,
    PointActionType.STREAK_BONUS_30: 500,
}

TIER_THRESHOLDS = [
    (0, UserTier.BRONZE),
    (1000, UserTier.PRATA),
    (5000, UserTier.OURO),
    (15000, UserTier.DIAMANTE),
    (50000, UserTier.LENDA),
]


class GamificationService:
    def __init__(self, db: AsyncSession, redis: Redis | None = None):
        self.db = db
        self.redis = redis
        self.user_repo = UserRepository(db)

    async def credit_points(
        self,
        user_id: str,
        action_type: PointActionType,
        points: int,
        description: str,
        ref_id: str | None = None,
    ) -> PointEvent:
        event = PointEvent(
            user_id=user_id,
            action_type=action_type,
            points=points,
            description=description,
            ref_id=ref_id,
        )
        self.db.add(event)

        user = await self.user_repo.get_by_id(user_id)
        if user:
            user.total_points += points
            user.current_points += points
            await self._check_tier_promotion(user)
            await self._update_leaderboard(user_id, points)

        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def debit_points(
        self,
        user_id: str,
        points: int,
        description: str,
        ref_id: str | None = None,
    ) -> PointEvent:
        user = await self.user_repo.get_by_id(user_id)
        if not user or user.current_points < points:
            available_points = user.current_points if user else 0
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Pontos insuficientes. Saldo: {available_points}",
            )

        event = PointEvent(
            user_id=user_id,
            action_type=PointActionType.REDEMPTION,
            points=-points,
            description=description,
            ref_id=ref_id,
        )
        self.db.add(event)
        user.current_points -= points
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def update_streak(self, user_id: str) -> UserStreak:
        today = date.today()

        result = await self.db.execute(
            select(UserStreak).where(UserStreak.user_id == user_id)
        )
        streak = result.scalar_one_or_none()

        if not streak:
            streak = UserStreak(
                user_id=user_id,
                current_streak=0,
                longest_streak=0,
                freeze_available=True,
            )
            self.db.add(streak)

        streak.current_streak = streak.current_streak or 0
        streak.longest_streak = streak.longest_streak or 0
        if streak.freeze_available is None:
            streak.freeze_available = True

        if streak.last_activity_date is None:
            streak.current_streak = 1
        elif streak.last_activity_date == today:
            return streak
        elif streak.last_activity_date == today - timedelta(days=1):
            streak.current_streak += 1
        elif (
            streak.last_activity_date == today - timedelta(days=2)
            and streak.freeze_available
        ):
            streak.current_streak += 1
            streak.freeze_available = False
            streak.freeze_used_date = today
        else:
            streak.current_streak = 1

        streak.last_activity_date = today
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak

        user = await self.user_repo.get_by_id(user_id)
        if user:
            user.streak_count = streak.current_streak

        await self.db.flush()
        await self._check_streak_bonus(user_id, streak.current_streak)
        await self.db.commit()
        await self.db.refresh(streak)
        return streak

    async def _check_streak_bonus(self, user_id: str, current_streak: int) -> None:
        bonuses = [
            (7, PointActionType.STREAK_BONUS_7, 100, "Bonus streak 7 dias"),
            (30, PointActionType.STREAK_BONUS_30, 500, "Bonus streak 30 dias"),
        ]
        for days, action_type, points, desc in bonuses:
            if current_streak == days:
                await self.credit_points(
                    user_id=user_id,
                    action_type=action_type,
                    points=points,
                    description=desc,
                )

    async def reset_monthly_freeze(self) -> int:
        result = await self.db.execute(update(UserStreak).values(freeze_available=True))
        await self.db.commit()
        return result.rowcount or 0

    async def _check_tier_promotion(self, user: User) -> None:
        new_tier = UserTier.BRONZE
        for threshold, tier in TIER_THRESHOLDS:
            if user.total_points >= threshold:
                new_tier = tier

        if new_tier != user.tier:
            old_tier = user.tier
            user.tier = new_tier
            event = PointEvent(
                user_id=user.id,
                action_type=PointActionType.TIER_PROMOTION,
                points=0,
                description=f"Promocao de tier: {old_tier.value} -> {new_tier.value}",
            )
            self.db.add(event)

    async def _update_leaderboard(self, user_id: str, points: int) -> None:
        if not self.redis:
            return
        try:
            key = self._leaderboard_key()
            await self.redis.zincrby(key, points, user_id)
            await self.redis.expire(key, 60 * 60 * 24 * 45)
        except Exception:
            return

    async def get_leaderboard(
        self, limit: int = 10, month: str | None = None
    ) -> list[dict]:
        if self.redis:
            try:
                key = self._leaderboard_key(month)
                results = await self.redis.zrevrange(
                    key, 0, limit - 1, withscores=True
                )

                leaderboard = []
                for rank, (user_id, score) in enumerate(results, 1):
                    user = await self.user_repo.get_by_id(user_id)
                    if user:
                        leaderboard.append(
                            {
                                "rank": rank,
                                "user_id": user_id,
                                "name": user.name,
                                "avatar_url": user.avatar_url,
                                "tier": user.tier.value,
                                "points": int(score),
                            }
                        )
                return leaderboard
            except Exception:
                pass
        return await self._leaderboard_fallback(limit, month)

    async def get_my_rank(self, user_id: str, month: str | None = None) -> dict | None:
        if not self.redis:
            return None
        try:
            key = self._leaderboard_key(month)
            rank = await self.redis.zrevrank(key, user_id)
            if rank is None:
                return None
            score = await self.redis.zscore(key, user_id)
            return {"rank": rank + 1, "points": int(score or 0)}
        except Exception:
            return None

    async def _leaderboard_fallback(
        self, limit: int, month: str | None
    ) -> list[dict]:
        now = datetime.now(UTC)
        if month:
            year, m = map(int, month.split("-"))
        else:
            year, m = now.year, now.month

        result = await self.db.execute(
            select(
                PointEvent.user_id,
                func.sum(PointEvent.points).label("total"),
            )
            .where(
                and_(
                    extract("year", PointEvent.created_at) == year,
                    extract("month", PointEvent.created_at) == m,
                    PointEvent.points > 0,
                )
            )
            .group_by(PointEvent.user_id)
            .order_by(func.sum(PointEvent.points).desc())
            .limit(limit)
        )
        rows = result.all()
        leaderboard = []
        for rank, row in enumerate(rows, 1):
            user = await self.user_repo.get_by_id(row.user_id)
            if user:
                leaderboard.append(
                    {
                        "rank": rank,
                        "user_id": row.user_id,
                        "name": user.name,
                        "avatar_url": user.avatar_url,
                        "tier": user.tier.value,
                        "points": int(row.total),
                    }
                )
        return leaderboard

    def _leaderboard_key(self, month: str | None = None) -> str:
        if month:
            return f"leaderboard:{month}"
        now = datetime.now(UTC)
        return f"leaderboard:{now.year}-{now.month:02d}"
