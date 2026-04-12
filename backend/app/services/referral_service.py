import secrets

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.models.point_event import PointActionType
from app.models.referral import Referral, ReferralStatus
from app.services.gamification_service import GamificationService

REFERRAL_REGISTER_BONUS = 100
REFERRAL_ACTIVATE_BONUS = 100


class ReferralService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_code(self, user_id: str) -> str:
        result = await self.db.execute(
            select(Referral.referral_code).where(Referral.referrer_id == user_id).limit(1)
        )
        code = result.scalar_one_or_none()
        if code:
            return code

        while True:
            code = f'GYM{secrets.token_hex(4).upper()}'
            exists_result = await self.db.execute(
                select(Referral.id).where(Referral.referral_code == code)
            )
            if exists_result.scalar_one_or_none() is None:
                break

        referral = Referral(referrer_id=user_id, referral_code=code)
        self.db.add(referral)
        await self.db.commit()
        return code

    async def process_registration(
        self,
        referral_code: str,
        new_user_id: str,
        new_user_email: str,
    ) -> None:
        result = await self.db.execute(
            select(Referral).where(Referral.referral_code == referral_code)
        )
        referral = result.scalar_one_or_none()
        if not referral:
            return

        if referral.referrer_id == new_user_id:
            return

        referral.referred_user_id = new_user_id
        referral.referred_email = new_user_email
        referral.status = ReferralStatus.REGISTERED

        try:
            redis = await get_redis()
        except Exception:
            redis = None

        gamification = GamificationService(self.db, redis)
        await gamification.credit_points(
            user_id=referral.referrer_id,
            action_type=PointActionType.REFERRAL,
            points=REFERRAL_REGISTER_BONUS,
            description='Indicação: amigo se cadastrou',
            ref_id=referral.id,
            commit=False,
        )
        await self.db.commit()

    async def process_first_checkin(self, user_id: str) -> None:
        result = await self.db.execute(
            select(Referral).where(
                and_(
                    Referral.referred_user_id == user_id,
                    Referral.status == ReferralStatus.REGISTERED,
                )
            )
        )
        referral = result.scalar_one_or_none()
        if not referral:
            return

        referral.status = ReferralStatus.ACTIVATED

        try:
            redis = await get_redis()
        except Exception:
            redis = None

        gamification = GamificationService(self.db, redis)
        await gamification.credit_points(
            user_id=referral.referrer_id,
            action_type=PointActionType.REFERRAL,
            points=REFERRAL_ACTIVATE_BONUS,
            description='Indicação: amigo fez primeiro check-in!',
            ref_id=referral.id,
            commit=False,
        )
        await self.db.commit()

    async def get_stats(self, user_id: str) -> dict:
        code = await self.get_or_create_code(user_id)

        total_result = await self.db.execute(
            select(func.count(Referral.id)).where(
                and_(
                    Referral.referrer_id == user_id,
                    Referral.referred_user_id.isnot(None),
                )
            )
        )
        activated_result = await self.db.execute(
            select(func.count(Referral.id)).where(
                and_(
                    Referral.referrer_id == user_id,
                    Referral.status == ReferralStatus.ACTIVATED,
                )
            )
        )
        total = total_result.scalar_one()
        activated = activated_result.scalar_one()

        return {
            'referral_code': code,
            'total_referred': total,
            'total_activated': activated,
            'points_earned': (total * REFERRAL_REGISTER_BONUS)
            + (activated * REFERRAL_ACTIVATE_BONUS),
        }
