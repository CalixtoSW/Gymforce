from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.models.user import User, UserRole
from app.schemas.notification import (
    PushTokenRegister,
    PushTokenResponse,
    SendNotificationRequest,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix='/notifications', tags=['notifications'])


@router.post('/register-token', response_model=PushTokenResponse, status_code=201)
async def register_push_token(
    data: PushTokenRegister,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PushTokenResponse:
    service = NotificationService(db)
    return await service.register_token(user.id, data.token, data.device_type)


@router.delete('/remove-token')
async def remove_push_token(
    data: PushTokenRegister,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    service = NotificationService(db)
    await service.remove_token(user.id, data.token)
    return {'message': 'Token removido'}


@router.post('/send', status_code=200)
async def send_notification(
    data: SendNotificationRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> dict[str, int]:
    service = NotificationService(db)
    if data.user_id:
        sent = await service.send_to_user(data.user_id, data.title, data.body)
    else:
        sent = await service.send_to_all(data.title, data.body)
    return {'sent': sent}
