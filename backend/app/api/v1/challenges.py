from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.models.challenge import ChallengeGoalType
from app.models.user import User, UserRole
from app.schemas.challenge import ChallengeCreate, ChallengeResponse, UserChallengeResponse
from app.services.challenge_service import ChallengeService

router = APIRouter(prefix='/challenges', tags=['challenges'])


@router.get('/', response_model=list[ChallengeResponse])
async def list_active_challenges(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ChallengeResponse]:
    _ = _user
    service = ChallengeService(db)
    data = await service.list_active()
    return [ChallengeResponse(**item) for item in data]


@router.post('/{challenge_id}/join', status_code=201)
async def join_challenge(
    challenge_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, object]:
    service = ChallengeService(db)
    user_challenge = await service.join(user.id, challenge_id)
    return {
        'message': 'Inscrito no desafio',
        'progress': user_challenge.progress,
        'completed': user_challenge.completed,
    }


@router.get('/my', response_model=list[UserChallengeResponse])
async def my_challenges(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[UserChallengeResponse]:
    service = ChallengeService(db)
    data = await service.get_my_challenges(user.id)
    return [UserChallengeResponse(**item) for item in data]


@router.post('/', response_model=ChallengeResponse, status_code=201)
async def create_challenge(
    data: ChallengeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> ChallengeResponse:
    _ = _admin
    service = ChallengeService(db)
    payload = data.model_dump()
    try:
        payload['goal_type'] = ChallengeGoalType(payload['goal_type'])
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail='goal_type inválido',
        ) from exc
    challenge = await service.create(payload)

    return ChallengeResponse(
        id=challenge.id,
        title=challenge.title,
        description=challenge.description,
        goal_type=challenge.goal_type.value,
        goal_value=challenge.goal_value,
        reward_points=challenge.reward_points,
        start_date=challenge.start_date,
        end_date=challenge.end_date,
        is_active=challenge.is_active,
        icon=challenge.icon,
        total_participants=0,
    )
