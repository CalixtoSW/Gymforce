from datetime import date

from pydantic import BaseModel, Field


class ChallengeCreate(BaseModel):
    title: str = Field(..., max_length=150)
    description: str | None = None
    goal_type: str
    goal_value: int = Field(..., ge=1)
    reward_points: int = Field(..., ge=0)
    start_date: date
    end_date: date
    icon: str = '🎯'


class ChallengeResponse(BaseModel):
    id: str
    title: str
    description: str | None
    goal_type: str
    goal_value: int
    reward_points: int
    start_date: date
    end_date: date
    is_active: bool
    icon: str
    total_participants: int = 0

    model_config = {'from_attributes': True}


class UserChallengeResponse(BaseModel):
    id: str
    challenge: ChallengeResponse
    progress: int
    completed: bool
    completed_at: date | None
    progress_pct: float = 0


class ReferralResponse(BaseModel):
    referral_code: str
    total_referred: int
    total_activated: int
    points_earned: int
