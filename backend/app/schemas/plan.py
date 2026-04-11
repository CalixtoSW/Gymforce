from pydantic import BaseModel, Field


class PlanCreate(BaseModel):
    name: str = Field(..., max_length=100)
    duration_days: int = Field(..., ge=1)
    price: float = Field(..., ge=0)
    description: str | None = None


class PlanResponse(BaseModel):
    id: str
    name: str
    duration_days: int
    price: float
    description: str | None
    is_active: bool

    model_config = {"from_attributes": True}
