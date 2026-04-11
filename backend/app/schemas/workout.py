from datetime import datetime

from pydantic import BaseModel, Field


class ExerciseCreate(BaseModel):
    name: str = Field(..., max_length=150)
    sets: int = Field(..., ge=1)
    reps: str = Field(..., max_length=20)
    rest_seconds: int = Field(60, ge=0)
    notes: str | None = None
    order: int = 0


class ExerciseResponse(BaseModel):
    id: str
    name: str
    sets: int
    reps: str
    rest_seconds: int
    notes: str | None
    order: int

    model_config = {"from_attributes": True}


class WorkoutSheetCreate(BaseModel):
    user_id: str
    name: str = Field(..., max_length=100)
    exercises: list[ExerciseCreate]


class WorkoutSheetResponse(BaseModel):
    id: str
    user_id: str
    created_by: str
    name: str
    is_active: bool
    exercises: list[ExerciseResponse]

    model_config = {"from_attributes": True}


class WorkoutComplete(BaseModel):
    sheet_id: str
    duration_minutes: int | None = None


class WorkoutResponse(BaseModel):
    id: str
    user_id: str
    sheet_id: str
    completed_at: datetime
    duration_minutes: int | None
    points_earned: int

    model_config = {"from_attributes": True}
