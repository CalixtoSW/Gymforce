from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.models.point_event import PointActionType
from app.models.workout import Exercise, Workout, WorkoutSheet
from app.repositories.workout_repo import WorkoutRepository
from app.services.badge_service import BadgeService
from app.services.gamification_service import GamificationService

WORKOUT_COMPLETE_POINTS = 25


class WorkoutService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WorkoutRepository(db)

    async def create_sheet(
        self,
        user_id: str,
        created_by: str,
        name: str,
        exercises_data: list[dict],
    ) -> WorkoutSheet:
        sheet = WorkoutSheet(user_id=user_id, created_by=created_by, name=name)
        exercises = [Exercise(**ex_data) for ex_data in exercises_data]
        return await self.repo.create_sheet(sheet, exercises)

    async def get_my_sheets(self, user_id: str) -> list[WorkoutSheet]:
        return await self.repo.list_sheets_by_user(user_id)

    async def get_sheet(self, sheet_id: str, user_id: str) -> WorkoutSheet:
        sheet = await self.repo.get_sheet_by_id(sheet_id)
        if not sheet or sheet.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ficha não encontrada",
            )
        return sheet

    async def complete_workout(
        self,
        user_id: str,
        sheet_id: str,
        duration_minutes: int | None,
    ) -> Workout:
        sheet = await self.repo.get_sheet_by_id(sheet_id)
        if not sheet or sheet.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ficha não encontrada",
            )

        workout = Workout(
            user_id=user_id,
            sheet_id=sheet_id,
            duration_minutes=duration_minutes,
            points_earned=WORKOUT_COMPLETE_POINTS,
        )
        workout = await self.repo.create_workout(workout)

        try:
            redis = await get_redis()
        except Exception:
            redis = None

        gamification = GamificationService(self.db, redis)
        await gamification.credit_points(
            user_id=user_id,
            action_type=PointActionType.WORKOUT_COMPLETE,
            points=WORKOUT_COMPLETE_POINTS,
            description=f"Treino concluido: {sheet.name}",
            ref_id=workout.id,
        )
        badge_service = BadgeService(self.db)
        await badge_service.evaluate(user_id)

        return workout

    async def get_my_history(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Workout]:
        return await self.repo.list_workouts_by_user(user_id, skip, limit)
