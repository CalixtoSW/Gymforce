from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.models.reward import Reward
from app.models.user import User, UserRole
from app.schemas.reward import (
    RedemptionResponse,
    RewardCreate,
    RewardResponse,
    RewardUpdate,
)
from app.services.reward_service import RewardService

router = APIRouter(prefix='/rewards', tags=['rewards'])


@router.get('/', response_model=list[RewardResponse])
async def list_rewards(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RewardResponse]:
    _ = user
    service = RewardService(db)
    return await service.list_available()


@router.post('/{reward_id}/redeem', response_model=RedemptionResponse, status_code=201)
async def redeem_reward(
    reward_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RedemptionResponse:
    service = RewardService(db)
    return await service.redeem(user.id, reward_id)


@router.get('/my-redemptions', response_model=list[RedemptionResponse])
async def my_redemptions(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[RedemptionResponse]:
    service = RewardService(db)
    return await service.list_user_redemptions(user.id, skip, limit)


@router.post('/', response_model=RewardResponse, status_code=201)
async def create_reward(
    data: RewardCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> RewardResponse:
    reward = Reward(**data.model_dump())
    db.add(reward)
    await db.commit()
    await db.refresh(reward)
    return reward


@router.patch('/{reward_id}', response_model=RewardResponse)
async def update_reward(
    reward_id: str,
    data: RewardUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> RewardResponse:
    reward = await db.get(Reward, reward_id)
    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Recompensa não encontrada',
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(reward, field, value)

    await db.commit()
    await db.refresh(reward)
    return reward


@router.get('/admin/pending', response_model=list[RedemptionResponse])
async def pending_redemptions(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.RECEPCAO))],
) -> list[RedemptionResponse]:
    service = RewardService(db)
    return await service.list_pending_redemptions()


@router.post(
    '/admin/redemptions/{redemption_id}/deliver',
    response_model=RedemptionResponse,
)
async def deliver_redemption(
    redemption_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.RECEPCAO))],
) -> RedemptionResponse:
    service = RewardService(db)
    return await service.deliver_redemption(redemption_id)


@router.post(
    '/admin/redemptions/{redemption_id}/cancel',
    response_model=RedemptionResponse,
)
async def cancel_redemption(
    redemption_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> RedemptionResponse:
    service = RewardService(db)
    return await service.cancel_redemption(redemption_id, admin.id)
