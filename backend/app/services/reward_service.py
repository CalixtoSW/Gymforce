from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import get_redis
from app.models.point_event import PointActionType
from app.models.redemption import Redemption, RedemptionStatus
from app.models.reward import Reward
from app.services.badge_service import BadgeService
from app.services.gamification_service import GamificationService


class RewardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_available(self) -> list[Reward]:
        result = await self.db.execute(
            select(Reward).where(Reward.is_active.is_(True)).order_by(Reward.created_at.desc())
        )
        rewards = list(result.scalars().all())
        return [
            reward for reward in rewards if reward.stock is None or reward.stock > 0
        ]

    async def redeem(self, user_id: str, reward_id: str) -> Redemption:
        reward = await self.db.get(Reward, reward_id)
        if not reward or not reward.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Recompensa não encontrada',
            )

        if reward.stock is not None and reward.stock <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Recompensa fora de estoque',
            )

        redemption = Redemption(
            user_id=user_id,
            reward_id=reward_id,
            points_spent=reward.cost_points,
            status=RedemptionStatus.PENDING,
        )
        self.db.add(redemption)
        await self.db.flush()

        try:
            redis = await get_redis()
        except Exception:
            redis = None

        gamification = GamificationService(self.db, redis)
        await gamification.debit_points(
            user_id=user_id,
            points=reward.cost_points,
            description=f'Resgate: {reward.name}',
            ref_id=redemption.id,
            commit=False,
        )

        if reward.stock is not None:
            reward.stock -= 1

        await self.db.commit()
        badge_service = BadgeService(self.db)
        await badge_service.evaluate(user_id)
        return await self._get_redemption_with_reward(redemption.id)

    async def cancel_redemption(self, redemption_id: str, admin_id: str) -> Redemption:
        redemption = await self._get_redemption_with_reward(redemption_id)
        if redemption.status != RedemptionStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Só é possível cancelar resgates pendentes',
            )

        try:
            redis = await get_redis()
        except Exception:
            redis = None

        gamification = GamificationService(self.db, redis)
        await gamification.credit_points(
            user_id=redemption.user_id,
            action_type=PointActionType.ADMIN_ADJUSTMENT,
            points=redemption.points_spent,
            description=(
                f'Devolução por cancelamento de resgate: {redemption.reward.name}'
            ),
            ref_id=redemption.id,
            commit=False,
        )

        if redemption.reward.stock is not None:
            redemption.reward.stock += 1

        redemption.status = RedemptionStatus.CANCELLED
        redemption.notes = f'Cancelado por admin {admin_id}'
        await self.db.commit()
        return await self._get_redemption_with_reward(redemption.id)

    async def deliver_redemption(self, redemption_id: str) -> Redemption:
        redemption = await self._get_redemption_with_reward(redemption_id)
        if redemption.status != RedemptionStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Só é possível entregar resgates pendentes',
            )

        redemption.status = RedemptionStatus.DELIVERED
        await self.db.commit()
        return await self._get_redemption_with_reward(redemption.id)

    async def list_user_redemptions(
        self, user_id: str, skip: int = 0, limit: int = 20
    ) -> list[Redemption]:
        result = await self.db.execute(
            select(Redemption)
            .options(selectinload(Redemption.reward))
            .where(Redemption.user_id == user_id)
            .order_by(Redemption.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_pending_redemptions(
        self, skip: int = 0, limit: int = 50
    ) -> list[Redemption]:
        result = await self.db.execute(
            select(Redemption)
            .options(selectinload(Redemption.reward), selectinload(Redemption.user))
            .where(Redemption.status == RedemptionStatus.PENDING)
            .order_by(Redemption.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def _get_redemption_with_reward(self, redemption_id: str) -> Redemption:
        result = await self.db.execute(
            select(Redemption)
            .options(selectinload(Redemption.reward), selectinload(Redemption.user))
            .where(Redemption.id == redemption_id)
        )
        redemption = result.scalar_one_or_none()
        if not redemption:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Resgate não encontrado',
            )
        return redemption
