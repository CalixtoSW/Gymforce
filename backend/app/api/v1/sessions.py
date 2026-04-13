from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.models.user import User, UserRole
from app.schemas.workout_session import (
    ActiveSessionSummary,
    FinishSessionRequest,
    LogSetRequest,
    PersonalFinishRequest,
    SetLogResponse,
    StartSessionRequest,
)
from app.services.session_service import SessionService

router = APIRouter(prefix='/sessions', tags=['workout-sessions'])


@router.post('/start', status_code=201)
async def start_session(
    data: StartSessionRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    session = await service.start(user.id, data.sheet_id)
    return await service.get_session_detail(session.id, user.id)


@router.post('/personal/finish')
async def personal_finish_session(
    data: PersonalFinishRequest,
    user: Annotated[User, Depends(require_role(UserRole.PERSONAL, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    session = await service.finish(
        data.session_id,
        user_id='',
        completion_type=data.completion_type,
        finished_by=user.id,
        partial_reason=data.partial_reason,
        partial_notes=data.partial_notes,
    )
    return await service.get_session_detail_any_user(session.id)


@router.get('/personal/active', response_model=list[ActiveSessionSummary])
async def personal_active_sessions(
    user: Annotated[User, Depends(require_role(UserRole.PERSONAL, UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    return await service.get_active_sessions_for_personal(user.id)


@router.get('/active')
async def get_active_session(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    session = await service.get_active_session(user.id)
    if not session:
        return None
    return await service.get_session_detail(session.id, user.id)


@router.get('/exercises/{exercise_id}/weight-history')
async def exercise_weight_history(
    exercise_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    return await service.get_exercise_weight_history(user.id, exercise_id)


@router.get('/')
async def session_history(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = SessionService(db)
    sessions = await service.get_session_history(user.id, skip, limit)
    details = []
    for item in sessions:
        details.append(await service.get_session_detail(item.id, user.id))
    return details


@router.get('/{session_id}')
async def get_session(
    session_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    return await service.get_session_detail(session_id, user.id)


@router.post('/{session_id}/pause')
async def pause_session(
    session_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    session = await service.pause(session_id, user.id)
    return {'status': session.status.value, 'paused_at': session.paused_at}


@router.post('/{session_id}/resume')
async def resume_session(
    session_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    session = await service.resume(session_id, user.id)
    return {
        'status': session.status.value,
        'total_pause_seconds': session.total_pause_seconds,
    }


@router.post('/{session_id}/log-set', response_model=SetLogResponse, status_code=201)
async def log_set(
    session_id: str,
    data: LogSetRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    return await service.log_set(session_id, user.id, data.model_dump())


@router.post('/{session_id}/finish')
async def finish_session(
    session_id: str,
    data: FinishSessionRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = SessionService(db)
    session = await service.finish(
        session_id,
        user.id,
        data.completion_type,
        finished_by=user.id,
        partial_reason=data.partial_reason,
        partial_notes=data.partial_notes,
    )
    return await service.get_session_detail_any_user(session.id)
