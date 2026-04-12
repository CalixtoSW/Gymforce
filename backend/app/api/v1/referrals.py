from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.challenge import ReferralResponse
from app.services.referral_service import ReferralService

router = APIRouter(prefix='/referrals', tags=['referrals'])


@router.get('/my-stats', response_model=ReferralResponse)
async def my_referral_stats(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReferralResponse:
    service = ReferralService(db)
    data = await service.get_stats(user.id)
    return ReferralResponse(**data)
