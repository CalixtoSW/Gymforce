from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.models.user import User, UserRole
from app.schemas.dashboard import CheckinsByDay, CheckinsByHour, DashboardKPIs
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix='/dashboard', tags=['dashboard'])


@router.get('/kpis', response_model=DashboardKPIs)
async def get_kpis(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> DashboardKPIs:
    service = DashboardService(db)
    return await service.get_kpis()


@router.get('/checkins/by-hour', response_model=list[CheckinsByHour])
async def checkins_by_hour(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    days: int = Query(30, ge=1, le=365),
) -> list[CheckinsByHour]:
    service = DashboardService(db)
    return await service.get_checkins_by_hour(days)


@router.get('/checkins/by-weekday', response_model=list[CheckinsByDay])
async def checkins_by_weekday(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    days: int = Query(30, ge=1, le=365),
) -> list[CheckinsByDay]:
    service = DashboardService(db)
    return await service.get_checkins_by_weekday(days)
