from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import and_, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkin import Checkin
from app.models.membership import Membership, MembershipStatus
from app.models.plan import Plan
from app.models.redemption import Redemption, RedemptionStatus
from app.models.user import User
from app.models.workout import Workout
from app.schemas.dashboard import CheckinsByDay, CheckinsByHour, DashboardKPIs


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_kpis(self) -> DashboardKPIs:
        now = datetime.now(UTC)
        today = now.date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        total_users = await self._scalar(
            select(func.count(User.id)).where(User.is_active.is_(True))
        )
        active_users = await self._scalar(
            select(func.count(Membership.id)).where(
                and_(
                    Membership.status == MembershipStatus.ACTIVE,
                    Membership.end_date >= today,
                )
            )
        )

        checkins_today = await self._scalar(
            select(func.count(Checkin.id)).where(
                Checkin.checked_in_at >= self._date_floor(today)
            )
        )
        checkins_this_week = await self._scalar(
            select(func.count(Checkin.id)).where(
                Checkin.checked_in_at >= self._date_floor(week_start)
            )
        )
        checkins_this_month = await self._scalar(
            select(func.count(Checkin.id)).where(
                Checkin.checked_in_at >= self._date_floor(month_start)
            )
        )

        workouts_this_week = await self._scalar(
            select(func.count(Workout.id)).where(
                Workout.completed_at >= self._date_floor(week_start)
            )
        )

        revenue_month = await self._scalar(
            select(func.coalesce(func.sum(Plan.price), 0))
            .select_from(Membership)
            .join(Plan, Membership.plan_id == Plan.id)
            .where(
                and_(
                    Membership.status == MembershipStatus.ACTIVE,
                    Membership.end_date >= today,
                )
            )
        )

        pending_redemptions = await self._scalar(
            select(func.count(Redemption.id)).where(
                Redemption.status == RedemptionStatus.PENDING
            )
        )

        return DashboardKPIs(
            total_users=int(total_users),
            active_users=int(active_users),
            checkins_today=int(checkins_today),
            checkins_this_week=int(checkins_this_week),
            checkins_this_month=int(checkins_this_month),
            workouts_this_week=int(workouts_this_week),
            revenue_month=float(revenue_month),
            pending_redemptions=int(pending_redemptions),
        )

    async def get_checkins_by_hour(self, days: int = 30) -> list[CheckinsByHour]:
        since = datetime.now(UTC) - timedelta(days=days)
        result = await self.db.execute(
            select(
                extract('hour', Checkin.checked_in_at).label('hour'),
                func.count(Checkin.id).label('count'),
            )
            .where(Checkin.checked_in_at >= since)
            .group_by('hour')
            .order_by('hour')
        )

        rows = result.all()
        hour_map = {int(row.hour): int(row.count) for row in rows}
        return [
            CheckinsByHour(hour=hour, count=hour_map.get(hour, 0))
            for hour in range(24)
        ]

    async def get_checkins_by_weekday(self, days: int = 30) -> list[CheckinsByDay]:
        since = datetime.now(UTC) - timedelta(days=days)
        result = await self.db.execute(
            select(
                extract('dow', Checkin.checked_in_at).label('dow'),
                func.count(Checkin.id).label('count'),
            )
            .where(Checkin.checked_in_at >= since)
            .group_by('dow')
            .order_by('dow')
        )

        rows = result.all()
        day_names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        dow_map = {int(row.dow): int(row.count) for row in rows}
        return [
            CheckinsByDay(day=day_names[d], count=dow_map.get(d, 0))
            for d in range(7)
        ]

    async def _scalar(self, statement):
        result = await self.db.execute(statement)
        return result.scalar_one()

    def _date_floor(self, value: date) -> datetime:
        return datetime.combine(value, time.min, tzinfo=UTC)
