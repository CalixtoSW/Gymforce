from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.badge import BadgeListResponse
from app.services.badge_service import BadgeService

router = APIRouter(prefix='/badges', tags=['badges'])


@router.get('/', response_model=BadgeListResponse)
async def get_my_badges(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BadgeListResponse:
    service = BadgeService(db)
    badges = await service.get_user_badges(user.id)
    earned = [item for item in badges if item['earned']]
    return BadgeListResponse(
        badges=badges,
        total_earned=len(earned),
        total_available=len(badges),
    )
