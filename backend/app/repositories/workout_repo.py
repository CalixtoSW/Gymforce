from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workout import Exercise, Workout, WorkoutSheet


class WorkoutRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_sheet(
        self,
        sheet: WorkoutSheet,
        exercises: list[Exercise],
    ) -> WorkoutSheet:
        self.db.add(sheet)
        await self.db.flush()
        for ex in exercises:
            ex.sheet_id = sheet.id
            self.db.add(ex)
        await self.db.commit()
        await self.db.refresh(sheet)
        return await self.get_sheet_by_id(sheet.id)

    async def get_sheet_by_id(self, sheet_id: str) -> WorkoutSheet | None:
        result = await self.db.execute(
            select(WorkoutSheet)
            .options(selectinload(WorkoutSheet.exercises))
            .where(WorkoutSheet.id == sheet_id)
        )
        return result.scalar_one_or_none()

    async def list_sheets_by_user(
        self,
        user_id: str,
        active_only: bool = True,
    ) -> list[WorkoutSheet]:
        query = (
            select(WorkoutSheet)
            .options(selectinload(WorkoutSheet.exercises))
            .where(WorkoutSheet.user_id == user_id)
        )
        if active_only:
            query = query.where(WorkoutSheet.is_active.is_(True))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_workout(self, workout: Workout) -> Workout:
        self.db.add(workout)
        await self.db.commit()
        await self.db.refresh(workout)
        return workout

    async def list_workouts_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Workout]:
        result = await self.db.execute(
            select(Workout)
            .where(Workout.user_id == user_id)
            .order_by(Workout.completed_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
