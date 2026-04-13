from datetime import datetime

from pydantic import BaseModel, Field


class StartSessionRequest(BaseModel):
    sheet_id: str


class LogSetRequest(BaseModel):
    exercise_id: str
    set_number: int = Field(..., ge=1)
    actual_reps: int | None = Field(None, ge=0)
    actual_weight_kg: float | None = Field(None, ge=0)
    status: str = 'completed'
    rest_seconds_taken: int | None = None
    notes: str | None = None


class PauseResumeRequest(BaseModel):
    pass


class FinishSessionRequest(BaseModel):
    completion_type: str
    partial_reason: str | None = None
    partial_notes: str | None = None


class PersonalFinishRequest(BaseModel):
    session_id: str
    completion_type: str
    partial_reason: str | None = None
    partial_notes: str | None = None


class SetLogResponse(BaseModel):
    id: str
    exercise_id: str
    set_number: int
    planned_reps: str
    planned_weight_kg: float | None
    actual_reps: int | None
    actual_weight_kg: float | None
    status: str
    rest_seconds_taken: int | None
    notes: str | None
    created_at: datetime

    model_config = {'from_attributes': True}


class SessionExerciseProgress(BaseModel):
    exercise_id: str
    exercise_name: str
    planned_sets: int
    planned_reps: str
    rest_seconds: int
    suggested_weight_kg: float | None
    sets_completed: int
    sets_remaining: int
    set_logs: list[SetLogResponse]


class SessionResponse(BaseModel):
    id: str
    user_id: str
    sheet_id: str
    sheet_name: str | None = None
    status: str
    started_at: datetime
    paused_at: datetime | None
    finished_at: datetime | None
    active_duration_seconds: int | None
    total_pause_seconds: int
    total_sets_planned: int
    total_sets_completed: int
    total_sets_skipped: int
    completion_pct: int
    partial_reason: str | None
    partial_notes: str | None
    finished_by: str | None
    points_earned: int
    exercises_progress: list[SessionExerciseProgress] = []

    model_config = {'from_attributes': True}


class ActiveSessionSummary(BaseModel):
    session_id: str
    user_id: str
    user_name: str
    sheet_name: str
    status: str
    started_at: datetime
    completion_pct: int
    current_exercise: str | None
    elapsed_minutes: int
