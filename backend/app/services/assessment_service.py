from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment
from app.schemas.assessment import AssessmentCreate, AssessmentEvolution


class AssessmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: AssessmentCreate, assessed_by: str) -> Assessment:
        assessment = Assessment(
            **data.model_dump(),
            assessed_by=assessed_by,
        )
        self.db.add(assessment)
        await self.db.commit()
        await self.db.refresh(assessment)
        return assessment

    async def list_by_user(self, user_id: str) -> list[Assessment]:
        result = await self.db.execute(
            select(Assessment)
            .where(Assessment.user_id == user_id)
            .order_by(Assessment.assessment_date.desc())
        )
        return list(result.scalars().all())

    async def get_evolution(self, user_id: str) -> list[AssessmentEvolution]:
        assessments = await self.list_by_user(user_id)
        if len(assessments) < 2:
            return []

        current = assessments[0]
        previous = assessments[1]

        metrics = [
            'weight_kg',
            'body_fat_pct',
            'muscle_mass_kg',
            'chest_cm',
            'waist_cm',
            'hips_cm',
            'right_arm_cm',
            'left_arm_cm',
            'right_thigh_cm',
            'left_thigh_cm',
            'right_calf_cm',
            'left_calf_cm',
        ]

        evolutions = []
        for metric in metrics:
            current_value = getattr(current, metric)
            previous_value = getattr(previous, metric)
            if current_value is None or previous_value is None:
                continue

            current_float = float(current_value)
            previous_float = float(previous_value)
            change = current_float - previous_float
            change_pct = (change / previous_float * 100) if previous_float != 0 else 0.0
            evolutions.append(
                AssessmentEvolution(
                    metric=metric,
                    previous=previous_float,
                    current=current_float,
                    change=round(change, 2),
                    change_pct=round(change_pct, 1),
                )
            )
        return evolutions

    @staticmethod
    def calculate_bmi(weight_kg: float | None, height_cm: float | None) -> float | None:
        if not weight_kg or not height_cm or height_cm <= 0:
            return None
        return round(weight_kg / ((height_cm / 100) ** 2), 1)
