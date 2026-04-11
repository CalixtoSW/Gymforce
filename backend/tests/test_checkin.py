from datetime import UTC, date, datetime, timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient
from jose import jwt

from app.core.config import settings
from app.core.security import create_qr_token
from app.models.membership import Membership, MembershipStatus
from app.models.plan import Plan


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


@pytest.mark.asyncio
async def test_generate_qr_code(async_client: AsyncClient):
    token, _ = await register_user(
        async_client,
        "Aluno QR",
        f"qr-{uuid4().hex}@test.com",
    )
    response = await async_client.get(
        "/api/v1/checkins/qr",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "qr_token" in data
    assert data["expires_in_seconds"] == 300


@pytest.mark.asyncio
async def test_checkin_success(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Aluno Checkin",
        f"checkin-{uuid4().hex}@test.com",
    )
    await create_active_membership(db_session, user_id)

    qr_token = create_qr_token(user_id)
    response = await async_client.post("/api/v1/checkins/", json={"qr_token": qr_token})

    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == user_id
    assert data["points_earned"] == 10


@pytest.mark.asyncio
async def test_checkin_no_membership(async_client: AsyncClient):
    _, user_id = await register_user(
        async_client,
        "Aluno Sem Matricula",
        f"nomembership-{uuid4().hex}@test.com",
    )

    qr_token = create_qr_token(user_id)
    response = await async_client.post("/api/v1/checkins/", json={"qr_token": qr_token})

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_checkin_duplicate_today(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Aluno Duplicado",
        f"duplicate-{uuid4().hex}@test.com",
    )
    await create_active_membership(db_session, user_id)

    qr_token = create_qr_token(user_id)
    first = await async_client.post("/api/v1/checkins/", json={"qr_token": qr_token})
    second = await async_client.post("/api/v1/checkins/", json={"qr_token": qr_token})

    assert first.status_code == 201
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_checkin_expired_qr(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        "Aluno Expirado",
        f"expired-{uuid4().hex}@test.com",
    )
    await create_active_membership(db_session, user_id)

    expired_payload = {
        "sub": user_id,
        "type": "qr_checkin",
        "exp": datetime.now(UTC) - timedelta(minutes=1),
    }
    expired_token = jwt.encode(
        expired_payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    response = await async_client.post(
        "/api/v1/checkins/",
        json={"qr_token": expired_token},
    )

    assert response.status_code == 400
