from datetime import datetime

from pydantic import BaseModel, Field


class RewardCreate(BaseModel):
    name: str = Field(..., max_length=150)
    description: str | None = None
    cost_points: int = Field(..., ge=1)
    stock: int | None = Field(None, ge=0)
    image_url: str | None = None
    category: str | None = None


class RewardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    cost_points: int | None = Field(None, ge=1)
    stock: int | None = Field(None, ge=0)
    image_url: str | None = None
    is_active: bool | None = None
    category: str | None = None


class RewardResponse(BaseModel):
    id: str
    name: str
    description: str | None
    cost_points: int
    stock: int | None
    image_url: str | None
    is_active: bool
    category: str | None

    model_config = {'from_attributes': True}


class RedemptionResponse(BaseModel):
    id: str
    user_id: str
    reward_id: str
    points_spent: int
    status: str
    notes: str | None
    created_at: datetime
    reward: RewardResponse

    model_config = {'from_attributes': True}
