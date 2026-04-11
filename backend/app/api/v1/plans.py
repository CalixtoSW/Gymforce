from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.models.plan import Plan
from app.models.user import User, UserRole
from app.schemas.plan import PlanCreate, PlanResponse

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/", response_model=list[PlanResponse])
async def list_plans(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[PlanResponse]:
    result = await db.execute(select(Plan).where(Plan.is_active.is_(True)))
    return list(result.scalars().all())


@router.post("/", response_model=PlanResponse, status_code=201)
async def create_plan(
    data: PlanCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> PlanResponse:
    plan = Plan(**data.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan
