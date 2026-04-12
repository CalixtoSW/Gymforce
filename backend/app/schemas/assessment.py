from datetime import date

from pydantic import BaseModel, Field


class AssessmentCreate(BaseModel):
    user_id: str
    assessment_date: date
    weight_kg: float | None = Field(None, ge=20, le=300)
    height_cm: float | None = Field(None, ge=100, le=250)
    body_fat_pct: float | None = Field(None, ge=1, le=60)
    muscle_mass_kg: float | None = Field(None, ge=10, le=150)
    chest_cm: float | None = None
    waist_cm: float | None = None
    hips_cm: float | None = None
    right_arm_cm: float | None = None
    left_arm_cm: float | None = None
    right_thigh_cm: float | None = None
    left_thigh_cm: float | None = None
    right_calf_cm: float | None = None
    left_calf_cm: float | None = None
    notes: str | None = None


class AssessmentResponse(BaseModel):
    id: str
    user_id: str
    assessed_by: str
    assessment_date: date
    weight_kg: float | None
    height_cm: float | None
    body_fat_pct: float | None
    muscle_mass_kg: float | None
    bmi: float | None = None
    chest_cm: float | None
    waist_cm: float | None
    hips_cm: float | None
    right_arm_cm: float | None
    left_arm_cm: float | None
    right_thigh_cm: float | None
    left_thigh_cm: float | None
    right_calf_cm: float | None
    left_calf_cm: float | None
    notes: str | None

    model_config = {'from_attributes': True}


class AssessmentEvolution(BaseModel):
    metric: str
    previous: float | None
    current: float | None
    change: float | None
    change_pct: float | None
