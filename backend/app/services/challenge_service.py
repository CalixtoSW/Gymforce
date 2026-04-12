from datetime import UTC, date, datetime, time

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import get_redis
from app.models.challenge import Challenge, ChallengeGoalType, UserChallenge
from app.models.checkin import Checkin
from app.models.point_event import PointActionType, PointEvent
from app.models.streak import UserStreak
from app.models.workout import Workout
from app.services.gamification_service import GamificationService


class ChallengeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Challenge:
        challenge = Challenge(**data)
        self.db.add(challenge)
        await self.db.commit()
        await self.db.refresh(challenge)
        return challenge

    async def list_active(self) -> list[dict]:
        today = date.today()
        result = await self.db.execute(
            select(Challenge).where(
                and_(Challenge.is_active.is_(True), Challenge.end_date >= today)
            )
        )
        challenges = list(result.scalars().all())

        output = []
        for challenge in challenges:
            count_result = await self.db.execute(
                select(func.count(UserChallenge.id)).where(
                    UserChallenge.challenge_id == challenge.id
                )
            )
            output.append(
                {
                    'id': challenge.id,
                    'title': challenge.title,
                    'description': challenge.description,
                    'goal_type': challenge.goal_type.value,
                    'goal_value': challenge.goal_value,
                    'reward_points': challenge.reward_points,
                    'start_date': challenge.start_date,
                    'end_date': challenge.end_date,
                    'is_active': challenge.is_active,
                    'icon': challenge.icon,
                    'total_participants': count_result.scalar_one(),
                }
            )
        return output

    async def join(self, user_id: str, challenge_id: str) -> UserChallenge:
        challenge = await self.db.get(Challenge, challenge_id)
        if not challenge or not challenge.is_active or challenge.end_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Desafio não encontrado ou encerrado',
            )

        result = await self.db.execute(
            select(UserChallenge).where(
                and_(
                    UserChallenge.user_id == user_id,
                    UserChallenge.challenge_id == challenge_id,
                )
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Já inscrito neste desafio',
            )

        initial_progress = await self._calculate_progress(
            user_id=user_id,
            goal_type=challenge.goal_type,
            start=challenge.start_date,
            end=challenge.end_date,
        )

        user_challenge = UserChallenge(
            user_id=user_id,
            challenge_id=challenge_id,
            progress=initial_progress,
            completed=initial_progress >= challenge.goal_value,
            completed_at=(
                date.today() if initial_progress >= challenge.goal_value else None
            ),
        )
        self.db.add(user_challenge)
        await self.db.commit()
        await self.db.refresh(user_challenge)

        if user_challenge.completed:
            await self._grant_reward(user_id, challenge)
            await self.db.commit()

        return user_challenge

    async def get_my_challenges(self, user_id: str) -> list[dict]:
        result = await self.db.execute(
            select(UserChallenge)
            .options(selectinload(UserChallenge.challenge))
            .where(UserChallenge.user_id == user_id)
            .order_by(UserChallenge.created_at.desc())
        )
        user_challenges = list(result.scalars().all())

        output = []
        for user_challenge in user_challenges:
            challenge = user_challenge.challenge
            progress_pct = (
                min((user_challenge.progress / challenge.goal_value) * 100, 100)
                if challenge.goal_value > 0
                else 0
            )
            output.append(
                {
                    'id': user_challenge.id,
                    'challenge': {
                        'id': challenge.id,
                        'title': challenge.title,
                        'description': challenge.description,
                        'goal_type': challenge.goal_type.value,
                        'goal_value': challenge.goal_value,
                        'reward_points': challenge.reward_points,
                        'start_date': challenge.start_date,
                        'end_date': challenge.end_date,
                        'is_active': challenge.is_active,
                        'icon': challenge.icon,
                        'total_participants': 0,
                    },
                    'progress': user_challenge.progress,
                    'completed': user_challenge.completed,
                    'completed_at': user_challenge.completed_at,
                    'progress_pct': round(progress_pct, 1),
                }
            )
        return output

    async def update_progress_for_user(self, user_id: str) -> list[UserChallenge]:
        today = date.today()
        result = await self.db.execute(
            select(UserChallenge)
            .options(selectinload(UserChallenge.challenge))
            .where(
                and_(
                    UserChallenge.user_id == user_id,
                    UserChallenge.completed.is_(False),
                )
            )
        )
        active_user_challenges = list(result.scalars().all())
        completed_now: list[UserChallenge] = []

        for user_challenge in active_user_challenges:
            challenge = user_challenge.challenge
            if challenge.end_date < today:
                continue

            new_progress = await self._calculate_progress(
                user_id=user_id,
                goal_type=challenge.goal_type,
                start=challenge.start_date,
                end=challenge.end_date,
            )
            user_challenge.progress = new_progress

            if new_progress >= challenge.goal_value and not user_challenge.completed:
                user_challenge.completed = True
                user_challenge.completed_at = today
                await self._grant_reward(user_id, challenge)
                completed_now.append(user_challenge)

        if active_user_challenges:
            await self.db.commit()

        return completed_now

    async def _calculate_progress(
        self,
        user_id: str,
        goal_type: ChallengeGoalType,
        start: date,
        end: date,
    ) -> int:
        start_dt = datetime.combine(start, time.min, tzinfo=UTC)
        end_dt = datetime.combine(end, time.max, tzinfo=UTC)

        if goal_type == ChallengeGoalType.CHECKINS:
            result = await self.db.execute(
                select(func.count(Checkin.id)).where(
                    and_(
                        Checkin.user_id == user_id,
                        Checkin.checked_in_at.between(start_dt, end_dt),
                    )
                )
            )
            return result.scalar_one()

        if goal_type == ChallengeGoalType.WORKOUTS:
            result = await self.db.execute(
                select(func.count(Workout.id)).where(
                    and_(
                        Workout.user_id == user_id,
                        Workout.completed_at.between(start_dt, end_dt),
                    )
                )
            )
            return result.scalar_one()

        if goal_type == ChallengeGoalType.POINTS:
            result = await self.db.execute(
                select(func.coalesce(func.sum(PointEvent.points), 0)).where(
                    and_(
                        PointEvent.user_id == user_id,
                        PointEvent.points > 0,
                        PointEvent.created_at.between(start_dt, end_dt),
                    )
                )
            )
            return int(result.scalar_one())

        if goal_type == ChallengeGoalType.STREAK:
            result = await self.db.execute(
                select(UserStreak).where(UserStreak.user_id == user_id)
            )
            streak = result.scalar_one_or_none()
            return streak.current_streak if streak else 0

        return 0

    async def _grant_reward(self, user_id: str, challenge: Challenge) -> None:
        if challenge.reward_points <= 0:
            return

        try:
            redis = await get_redis()
        except Exception:
            redis = None

        gamification = GamificationService(self.db, redis)
        await gamification.credit_points(
            user_id=user_id,
            action_type=PointActionType.CHALLENGE,
            points=challenge.reward_points,
            description=f'Desafio concluído: {challenge.title}',
            ref_id=challenge.id,
            commit=False,
        )
