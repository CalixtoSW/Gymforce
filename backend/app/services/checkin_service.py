from datetime import date

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.models.checkin import Checkin
from app.models.membership import Membership, MembershipStatus
from app.repositories.checkin_repo import CheckinRepository

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
        return await self.repo.create(checkin)
