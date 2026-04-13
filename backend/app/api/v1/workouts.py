from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.models.user import User, UserRole
from app.schemas.workout import (
    WorkoutComplete,
    WorkoutResponse,
    WorkoutSheetCreate,
    WorkoutSheetResponse,
)
from app.services.workout_service import WorkoutService

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.get("/sheets", response_model=list[WorkoutSheetResponse])
async def list_my_sheets(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[WorkoutSheetResponse]:
    service = WorkoutService(db)
    return await service.get_my_sheets(user.id)


@router.get("/sheets/{sheet_id}", response_model=WorkoutSheetResponse)
async def get_sheet(
    sheet_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkoutSheetResponse:
    service = WorkoutService(db)
    return await service.get_sheet(sheet_id, user.id)


@router.post("/sheets", response_model=WorkoutSheetResponse, status_code=201)
async def create_sheet(
    data: WorkoutSheetCreate,
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.PERSONAL, UserRole.ADMIN)),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkoutSheetResponse:
    service = WorkoutService(db)
    exercises_data = [ex.model_dump() for ex in data.exercises]
    return await service.create_sheet(
        user_id=data.user_id,
        created_by=current_user.id,
        name=data.name,
        exercises_data=exercises_data,
    )


@router.post(
    "/complete",
    response_model=WorkoutResponse,
    status_code=201,
    deprecated=True,
    summary="[DEPRECATED] Use POST /sessions/start + /finish",
)
async def complete_workout(
    data: WorkoutComplete,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkoutResponse:
    service = WorkoutService(db)
    return await service.complete_workout(
        user_id=user.id,
        sheet_id=data.sheet_id,
        duration_minutes=data.duration_minutes,
    )


@router.get("/history", response_model=list[WorkoutResponse])
async def workout_history(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[WorkoutResponse]:
    service = WorkoutService(db)
    return await service.get_my_history(user.id, skip, limit)
