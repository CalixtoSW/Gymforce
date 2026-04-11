from datetime import UTC, date, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import create_qr_token
from app.models.membership import Membership, MembershipStatus
from app.models.plan import Plan
from app.models.point_event import PointActionType, PointEvent
from app.models.streak import UserStreak
from app.models.user import UserRole, UserTier
from app.repositories.user_repo import UserRepository
from app.services.gamification_service import GamificationService


async def register_user(client: AsyncClient, name: str, email: str) -> tuple[str, str]:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "name": name,
            "email": email,
            "password": "senhaforte123",
        },
    )
    assert response.status_code == 201
    access_token = response.json()["access_token"]

    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me.status_code == 200
    return access_token, me.json()["id"]


async def create_active_membership(db_session, user_id: str) -> None:
    plan = Plan(name="Mensal", duration_days=30, price=99.9)
    db_session.add(plan)
    await db_session.commit()
    await db_session.refresh(plan)

    membership = Membership(
        user_id=user_id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=10),
        status=MembershipStatus.ACTIVE,
        payment_status="paid",
    )
    db_session.add(membership)
    await db_session.commit()


async def promote_to_personal(db_session, email: str) -> None:
    repo = UserRepository(db_session)
    user = await repo.get_by_email(email)
    assert user is not None
    user.role = UserRole.PERSONAL
    await repo.update(user)


def sample_exercises() -> list[dict]:
    return [
        {
            "name": "Supino",
            "sets": 4,
            "reps": "12",
            "rest_seconds": 60,
            "order": 1,
        }
    ]


@pytest.mark.asyncio
async def test_credit_points(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Credit User",
        f"credit-{uuid4().hex}@test.com",
    )
    service = GamificationService(db_session, redis=None)

    await service.credit_points(
        user_id=user_id,
        action_type=PointActionType.CHECKIN,
        points=10,
        description="Check-in na academia",
    )

    user = await UserRepository(db_session).get_by_id(user_id)
    assert user is not None
    assert user.total_points == 10
    assert user.current_points == 10


@pytest.mark.asyncio
async def test_point_event_created(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Event User",
        f"event-{uuid4().hex}@test.com",
    )
    service = GamificationService(db_session, redis=None)

    event = await service.credit_points(
        user_id=user_id,
        action_type=PointActionType.CHECKIN,
        points=10,
        description="Check-in",
    )

    result = await db_session.execute(
        select(PointEvent).where(PointEvent.id == event.id)
    )
    stored = result.scalar_one_or_none()
    assert stored is not None
    assert stored.action_type == PointActionType.CHECKIN
    assert stored.points == 10


@pytest.mark.asyncio
async def test_streak_first_checkin(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Streak First",
        f"streak-first-{uuid4().hex}@test.com",
    )
    service = GamificationService(db_session, redis=None)

    streak = await service.update_streak(user_id)

    assert streak.current_streak == 1
    assert streak.longest_streak == 1


@pytest.mark.asyncio
async def test_streak_consecutive(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Streak Consecutive",
        f"streak-consecutive-{uuid4().hex}@test.com",
    )

    db_session.add(
        UserStreak(
            user_id=user_id,
            current_streak=3,
            longest_streak=3,
            last_activity_date=date.today() - timedelta(days=1),
            freeze_available=True,
        )
    )
    await db_session.commit()

    streak = await GamificationService(db_session, redis=None).update_streak(user_id)

    assert streak.current_streak == 4
    assert streak.longest_streak == 4


@pytest.mark.asyncio
async def test_streak_broken(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Streak Broken",
        f"streak-broken-{uuid4().hex}@test.com",
    )

    db_session.add(
        UserStreak(
            user_id=user_id,
            current_streak=5,
            longest_streak=5,
            last_activity_date=date.today() - timedelta(days=3),
            freeze_available=True,
        )
    )
    await db_session.commit()

    streak = await GamificationService(db_session, redis=None).update_streak(user_id)

    assert streak.current_streak == 1
    assert streak.longest_streak == 5


@pytest.mark.asyncio
async def test_streak_freeze(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Streak Freeze",
        f"streak-freeze-{uuid4().hex}@test.com",
    )

    db_session.add(
        UserStreak(
            user_id=user_id,
            current_streak=5,
            longest_streak=5,
            last_activity_date=date.today() - timedelta(days=2),
            freeze_available=True,
        )
    )
    await db_session.commit()

    streak = await GamificationService(db_session, redis=None).update_streak(user_id)

    assert streak.current_streak == 6
    assert streak.freeze_available is False
    assert streak.freeze_used_date == date.today()


@pytest.mark.asyncio
async def test_streak_bonus_7_days(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Streak Bonus",
        f"streak-bonus-{uuid4().hex}@test.com",
    )

    db_session.add(
        UserStreak(
            user_id=user_id,
            current_streak=6,
            longest_streak=6,
            last_activity_date=date.today() - timedelta(days=1),
            freeze_available=True,
        )
    )
    await db_session.commit()

    await GamificationService(db_session, redis=None).update_streak(user_id)

    user = await UserRepository(db_session).get_by_id(user_id)
    assert user is not None
    assert user.total_points == 100

    result = await db_session.execute(
        select(PointEvent).where(
            PointEvent.user_id == user_id,
            PointEvent.action_type == PointActionType.STREAK_BONUS_7,
        )
    )
    assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_tier_promotion(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Tier Promotion",
        f"tier-promotion-{uuid4().hex}@test.com",
    )

    service = GamificationService(db_session, redis=None)
    await service.credit_points(
        user_id=user_id,
        action_type=PointActionType.ADMIN_ADJUSTMENT,
        points=1000,
        description="Ajuste de pontos",
    )

    user = await UserRepository(db_session).get_by_id(user_id)
    assert user is not None
    assert user.tier == UserTier.PRATA

    result = await db_session.execute(
        select(PointEvent).where(
            PointEvent.user_id == user_id,
            PointEvent.action_type == PointActionType.TIER_PROMOTION,
        )
    )
    assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_tier_promotion_chain(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Tier Chain",
        f"tier-chain-{uuid4().hex}@test.com",
    )

    service = GamificationService(db_session, redis=None)
    await service.credit_points(
        user_id=user_id,
        action_type=PointActionType.ADMIN_ADJUSTMENT,
        points=5000,
        description="Ajuste grande",
    )

    user = await UserRepository(db_session).get_by_id(user_id)
    assert user is not None
    assert user.tier == UserTier.OURO


@pytest.mark.asyncio
async def test_debit_points(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Debit User",
        f"debit-{uuid4().hex}@test.com",
    )

    service = GamificationService(db_session, redis=None)
    await service.credit_points(
        user_id=user_id,
        action_type=PointActionType.ADMIN_ADJUSTMENT,
        points=200,
        description="Credito inicial",
    )
    await service.debit_points(
        user_id=user_id,
        points=80,
        description="Resgate",
    )

    user = await UserRepository(db_session).get_by_id(user_id)
    assert user is not None
    assert user.total_points == 200
    assert user.current_points == 120


@pytest.mark.asyncio
async def test_debit_insufficient(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Debit Insufficient",
        f"debit-insufficient-{uuid4().hex}@test.com",
    )

    service = GamificationService(db_session, redis=None)
    with pytest.raises(HTTPException) as exc:
        await service.debit_points(
            user_id=user_id,
            points=50,
            description="Resgate sem saldo",
        )

    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_leaderboard_fallback(async_client: AsyncClient, db_session):
    _, user1_id = await register_user(
        async_client,
        "Leader 1",
        f"leader1-{uuid4().hex}@test.com",
    )
    _, user2_id = await register_user(
        async_client,
        "Leader 2",
        f"leader2-{uuid4().hex}@test.com",
    )

    service = GamificationService(db_session, redis=None)
    await service.credit_points(
        user_id=user1_id,
        action_type=PointActionType.CHECKIN,
        points=30,
        description="Check-in",
    )
    await service.credit_points(
        user_id=user2_id,
        action_type=PointActionType.WORKOUT_COMPLETE,
        points=90,
        description="Workout",
    )

    month = datetime.now(UTC).strftime("%Y-%m")
    leaderboard = await service.get_leaderboard(limit=10, month=month)

    assert len(leaderboard) >= 2
    points_by_user = {entry["user_id"]: entry["points"] for entry in leaderboard}
    assert points_by_user[user2_id] >= 90
    assert points_by_user[user2_id] > points_by_user[user1_id]


@pytest.mark.asyncio
async def test_checkin_triggers_gamification(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Checkin Trigger",
        f"checkin-trigger-{uuid4().hex}@test.com",
    )
    await create_active_membership(db_session, user_id)

    qr_token = create_qr_token(user_id)
    response = await async_client.post("/api/v1/checkins/", json={"qr_token": qr_token})

    assert response.status_code == 201

    user = await UserRepository(db_session).get_by_id(user_id)
    assert user is not None
    assert user.total_points == 10
    assert user.current_points == 10
    assert user.streak_count == 1

    event_result = await db_session.execute(
        select(PointEvent).where(
            PointEvent.user_id == user_id,
            PointEvent.action_type == PointActionType.CHECKIN,
        )
    )
    assert event_result.scalar_one_or_none() is not None

    streak_result = await db_session.execute(
        select(UserStreak).where(UserStreak.user_id == user_id)
    )
    streak = streak_result.scalar_one_or_none()
    assert streak is not None
    assert streak.current_streak == 1


@pytest.mark.asyncio
async def test_workout_triggers_gamification(async_client: AsyncClient, db_session):
    personal_email = f"personal-m4-{uuid4().hex}@test.com"
    _, _ = await register_user(async_client, "Personal M4", personal_email)
    aluno_token, aluno_id = await register_user(
        async_client,
        "Aluno M4",
        f"aluno-m4-{uuid4().hex}@test.com",
    )
    await promote_to_personal(db_session, personal_email)

    personal_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": personal_email, "password": "senhaforte123"},
    )
    personal_token = personal_login.json()["access_token"]

    created = await async_client.post(
        "/api/v1/workouts/sheets",
        headers={"Authorization": f"Bearer {personal_token}"},
        json={
            "user_id": aluno_id,
            "name": "Treino M4",
            "exercises": sample_exercises(),
        },
    )
    assert created.status_code == 201
    sheet_id = created.json()["id"]

    completed = await async_client.post(
        "/api/v1/workouts/complete",
        headers={"Authorization": f"Bearer {aluno_token}"},
        json={"sheet_id": sheet_id, "duration_minutes": 40},
    )
    assert completed.status_code == 201

    user = await UserRepository(db_session).get_by_id(aluno_id)
    assert user is not None
    assert user.total_points == 25
    assert user.current_points == 25

    event_result = await db_session.execute(
        select(PointEvent).where(
            PointEvent.user_id == aluno_id,
            PointEvent.action_type == PointActionType.WORKOUT_COMPLETE,
        )
    )
    assert event_result.scalar_one_or_none() is not None
