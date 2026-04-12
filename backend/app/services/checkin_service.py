from datetime import date

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.core.security import decode_token
from app.models.checkin import Checkin
from app.models.membership import Membership, MembershipStatus
from app.models.point_event import PointActionType
from app.repositories.checkin_repo import CheckinRepository
from app.services.badge_service import BadgeService
from app.services.challenge_service import ChallengeService
from app.services.gamification_service import GamificationService
from app.services.referral_service import ReferralService

CHECKIN_POINTS = 10


class CheckinService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CheckinRepository(db)

    async def _validate_membership(self, user_id: str) -> None:
        today = date.today()
        result = await self.db.execute(
            select(Membership).where(
                and_(
                    Membership.user_id == user_id,
                    Membership.status == MembershipStatus.ACTIVE,
                    Membership.end_date >= today,
                )
            )
        )
        membership = result.scalar_one_or_none()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Matrícula inativa ou vencida. Procure a recepção.",
            )

    async def checkin_via_qr(self, qr_token: str) -> Checkin:
        try:
            payload = decode_token(qr_token)
            if payload.get("type") != "qr_checkin":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="QR Code inválido",
                )
            user_id = payload["sub"]
        except JWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR Code expirado ou inválido",
            ) from exc

        await self._validate_membership(user_id)

        existing = await self.repo.get_today_checkin(user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Check-in já realizado hoje",
            )

        checkin = Checkin(user_id=user_id, points_earned=CHECKIN_POINTS)
        checkin = await self.repo.create(checkin)

        try:
            redis = await get_redis()
        except Exception:
            redis = None

        gamification = GamificationService(self.db, redis)
        await gamification.credit_points(
            user_id=user_id,
            action_type=PointActionType.CHECKIN,
            points=CHECKIN_POINTS,
            description="Check-in na academia",
            ref_id=checkin.id,
        )
        await gamification.update_streak(user_id)
        badge_service = BadgeService(self.db)
        await badge_service.evaluate(user_id)
        challenge_service = ChallengeService(self.db)
        await challenge_service.update_progress_for_user(user_id)

        count_result = await self.db.execute(
            select(func.count(Checkin.id)).where(Checkin.user_id == user_id)
        )
        if count_result.scalar_one() == 1:
            referral_service = ReferralService(self.db)
            await referral_service.process_first_checkin(user_id)

        return checkin
