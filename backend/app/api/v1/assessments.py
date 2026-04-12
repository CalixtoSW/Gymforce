from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.models.user import User, UserRole
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentEvolution,
    AssessmentResponse,
)
from app.services.assessment_service import AssessmentService

router = APIRouter(prefix='/assessments', tags=['assessments'])


@router.post('/', response_model=AssessmentResponse, status_code=201)
async def create_assessment(
    data: AssessmentCreate,
    current_user: Annotated[
        User, Depends(require_role(UserRole.PERSONAL, UserRole.ADMIN))
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AssessmentResponse:
    service = AssessmentService(db)
    assessment = await service.create(data, current_user.id)
    response = AssessmentResponse.model_validate(assessment)
    response.bmi = service.calculate_bmi(
        float(assessment.weight_kg) if assessment.weight_kg is not None else None,
        float(assessment.height_cm) if assessment.height_cm is not None else None,
    )
    return response


@router.get('/history', response_model=list[AssessmentResponse])
async def my_assessments(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[AssessmentResponse]:
    service = AssessmentService(db)
    assessments = await service.list_by_user(user.id)

    output = []
    for assessment in assessments:
        response = AssessmentResponse.model_validate(assessment)
        response.bmi = service.calculate_bmi(
            float(assessment.weight_kg) if assessment.weight_kg is not None else None,
            float(assessment.height_cm) if assessment.height_cm is not None else None,
        )
        output.append(response)
    return output


@router.get('/evolution', response_model=list[AssessmentEvolution])
async def my_evolution(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[AssessmentEvolution]:
    service = AssessmentService(db)
    return await service.get_evolution(user.id)
