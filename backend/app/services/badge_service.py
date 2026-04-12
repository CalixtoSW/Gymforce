from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.badge import Badge
from app.models.checkin import Checkin
from app.models.membership import Membership, MembershipStatus
from app.models.point_event import PointActionType
from app.models.redemption import Redemption
from app.models.streak import UserStreak
from app.models.user import User, UserTier
from app.models.user_badge import UserBadge
from app.models.workout import Workout
from app.services.gamification_service import GamificationService


class BadgeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate(self, user_id: str) -> list[UserBadge]:
        new_badges: list[UserBadge] = []

        result = await self.db.execute(
            select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
        )
        earned_ids = set(result.scalars().all())

        result = await self.db.execute(select(Badge).where(Badge.is_active.is_(True)))
        all_badges = list(result.scalars().all())

        gamification = GamificationService(self.db)
        for badge in all_badges:
            if badge.id in earned_ids:
                continue

            earned = await self._check_criteria(user_id, badge.code)
            if not earned:
                continue

            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            self.db.add(user_badge)
            new_badges.append(user_badge)

            if badge.points_bonus > 0:
                await gamification.credit_points(
                    user_id=user_id,
                    action_type=PointActionType.CHALLENGE,
                    points=badge.points_bonus,
                    description=f'Badge desbloqueado: {badge.name}',
                    ref_id=badge.id,
                    commit=False,
                )

        if new_badges:
            await self.db.commit()
            for badge in new_badges:
                await self.db.refresh(badge)

        return new_badges

    async def _check_criteria(self, user_id: str, badge_code: str) -> bool:
        now = datetime.now(UTC)

        if badge_code == 'early_bird':
            result = await self.db.execute(
                select(func.count(Checkin.id)).where(
                    and_(
                        Checkin.user_id == user_id,
                        extract('hour', Checkin.checked_in_at) < 7,
                    )
                )
            )
            return result.scalar_one() >= 5

        if badge_code == 'first_week':
            user = await self.db.get(User, user_id)
            if not user:
                return False
            first_week_end = user.created_at + timedelta(days=7)
            result = await self.db.execute(
                select(func.count(Workout.id)).where(
                    and_(
                        Workout.user_id == user_id,
                        Workout.completed_at <= first_week_end,
                    )
                )
            )
            return result.scalar_one() >= 3

        if badge_code == 'streak_7':
            result = await self.db.execute(
                select(UserStreak).where(UserStreak.user_id == user_id)
            )
            streak = result.scalar_one_or_none()
            return streak is not None and streak.longest_streak >= 7

        if badge_code == 'streak_30':
            result = await self.db.execute(
                select(UserStreak).where(UserStreak.user_id == user_id)
            )
            streak = result.scalar_one_or_none()
            return streak is not None and streak.longest_streak >= 30

        if badge_code == 'unstoppable':
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            result = await self.db.execute(
                select(func.count(Workout.id)).where(
                    and_(Workout.user_id == user_id, Workout.completed_at >= month_start)
                )
            )
            return result.scalar_one() >= 30

        if badge_code == 'loyal_member':
            result = await self.db.execute(
                select(Membership).where(
                    and_(
                        Membership.user_id == user_id,
                        Membership.status == MembershipStatus.ACTIVE,
                        Membership.start_date <= (now - timedelta(days=180)).date(),
                    )
                )
            )
            return result.scalar_one_or_none() is not None

        if badge_code == 'tier_diamond':
            user = await self.db.get(User, user_id)
            return user is not None and user.tier in (UserTier.DIAMANTE, UserTier.LENDA)

        if badge_code == 'first_redeem':
            result = await self.db.execute(
                select(func.count(Redemption.id)).where(Redemption.user_id == user_id)
            )
            return result.scalar_one() >= 1

        if badge_code == 'hundred_checkins':
            result = await self.db.execute(
                select(func.count(Checkin.id)).where(Checkin.user_id == user_id)
            )
            return result.scalar_one() >= 100

        if badge_code == 'top_3_monthly':
            return False

        return False

    async def get_user_badges(self, user_id: str) -> list[dict]:
        result = await self.db.execute(select(Badge).where(Badge.is_active.is_(True)))
        all_badges = list(result.scalars().all())

        result = await self.db.execute(select(UserBadge).where(UserBadge.user_id == user_id))
        earned = {badge.badge_id: badge.earned_at for badge in result.scalars().all()}

        badges: list[dict] = []
        for badge in all_badges:
            earned_at = earned.get(badge.id)
            badges.append(
                {
                    'id': badge.id,
                    'code': badge.code,
                    'name': badge.name,
                    'description': badge.description,
                    'icon': badge.icon,
                    'points_bonus': badge.points_bonus,
                    'category': badge.category,
                    'earned': badge.id in earned,
                    'earned_at': earned_at.isoformat() if earned_at else None,
                }
            )
        return badges
