from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.security import create_qr_token
from app.models.user import User
from app.repositories.checkin_repo import CheckinRepository
from app.schemas.checkin import CheckinQRPayload, CheckinResponse, QRCodeResponse
from app.services.checkin_service import CheckinService

router = APIRouter(prefix="/checkins", tags=["checkins"])


@router.post("/", response_model=CheckinResponse, status_code=201)
async def do_checkin(
    data: CheckinQRPayload,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CheckinResponse:
    service = CheckinService(db)
    return await service.checkin_via_qr(data.qr_token)


@router.get("/qr", response_model=QRCodeResponse)
async def get_my_qr(user: Annotated[User, Depends(get_current_user)]) -> QRCodeResponse:
    token = create_qr_token(user.id)
    return QRCodeResponse(qr_token=token, expires_in_seconds=300)


@router.get("/", response_model=list[CheckinResponse])
async def list_my_checkins(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[CheckinResponse]:
    repo = CheckinRepository(db)
    return await repo.list_by_user(user.id, skip, limit)
