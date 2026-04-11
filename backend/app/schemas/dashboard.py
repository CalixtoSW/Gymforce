from pydantic import BaseModel


class DashboardKPIs(BaseModel):
    total_users: int
    active_users: int
    checkins_today: int
    checkins_this_week: int
    checkins_this_month: int
    workouts_this_week: int
    revenue_month: float
    pending_redemptions: int


class CheckinsByHour(BaseModel):
    hour: int
    count: int


class CheckinsByDay(BaseModel):
    day: str
    count: int
