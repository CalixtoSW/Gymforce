from datetime import datetime

from pydantic import BaseModel


class PointEventResponse(BaseModel):
    id: str
    action_type: str
    points: int
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    freeze_available: bool
    last_activity_date: str | None


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    avatar_url: str | None
    tier: str
    points: int


class LeaderboardResponse(BaseModel):
    leaderboard: list[LeaderboardEntry]
    my_rank: dict | None = None


class GamificationSummary(BaseModel):
    total_points: int
    current_points: int
    tier: str
    streak: StreakResponse
    rank: dict | None = None
