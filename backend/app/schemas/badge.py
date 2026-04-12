from pydantic import BaseModel


class BadgeResponse(BaseModel):
    id: str
    code: str
    name: str
    description: str
    icon: str
    points_bonus: int
    category: str
    earned: bool
    earned_at: str | None


class BadgeListResponse(BaseModel):
    badges: list[BadgeResponse]
    total_earned: int
    total_available: int
