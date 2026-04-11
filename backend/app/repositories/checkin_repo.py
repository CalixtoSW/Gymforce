from datetime import UTC, datetime

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkin import Checkin


class CheckinRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, checkin: Checkin) -> Checkin:
        self.db.add(checkin)
        await self.db.commit()
        await self.db.refresh(checkin)
        return checkin

    async def get_today_checkin(self, user_id: str) -> Checkin | None:
        today_start = datetime.now(UTC).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )
        result = await self.db.execute(
            select(Checkin).where(
                and_(
                    Checkin.user_id == user_id,
                    Checkin.checked_in_at >= today_start,
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Checkin]:
        result = await self.db.execute(
            select(Checkin)
            .where(Checkin.user_id == user_id)
            .order_by(Checkin.checked_in_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
