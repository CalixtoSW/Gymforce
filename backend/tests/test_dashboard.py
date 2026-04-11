from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.models.user import UserRole
from app.repositories.user_repo import UserRepository


async def register_user(client: AsyncClient, name: str, email: str) -> tuple[str, str]:
    response = await client.post(
        '/api/v1/auth/register',
        json={
            'name': name,
            'email': email,
            'password': 'senhaforte123',
        },
    )
    assert response.status_code == 201
    access_token = response.json()['access_token']

    me = await client.get(
        '/api/v1/auth/me',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    assert me.status_code == 200
    return access_token, me.json()['id']


async def promote_to_admin(db_session, email: str) -> None:
    repo = UserRepository(db_session)
    user = await repo.get_by_email(email)
    assert user is not None
    user.role = UserRole.ADMIN
    await repo.update(user)


@pytest.mark.asyncio
async def test_kpis_admin(async_client: AsyncClient, db_session):
    admin_email = f'admin-kpis-{uuid4().hex}@test.com'
    admin_token, _ = await register_user(async_client, 'Admin KPIs', admin_email)
    await promote_to_admin(db_session, admin_email)

    response = await async_client.get(
        '/api/v1/dashboard/kpis',
        headers={'Authorization': f'Bearer {admin_token}'},
    )

    assert response.status_code == 200
    data = response.json()
    assert {
        'total_users',
        'active_users',
        'checkins_today',
        'checkins_this_week',
        'checkins_this_month',
        'workouts_this_week',
        'revenue_month',
        'pending_redemptions',
    }.issubset(data.keys())


@pytest.mark.asyncio
async def test_kpis_aluno_forbidden(async_client: AsyncClient):
    token, _ = await register_user(
        async_client,
        'Aluno Dash',
        f'aluno-dash-{uuid4().hex}@test.com',
    )

    response = await async_client.get(
        '/api/v1/dashboard/kpis',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_checkins_by_hour(async_client: AsyncClient, db_session):
    admin_email = f'admin-hour-{uuid4().hex}@test.com'
    admin_token, _ = await register_user(async_client, 'Admin Hour', admin_email)
    await promote_to_admin(db_session, admin_email)

    response = await async_client.get(
        '/api/v1/dashboard/checkins/by-hour',
        headers={'Authorization': f'Bearer {admin_token}'},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 24
    assert [entry['hour'] for entry in data] == list(range(24))


@pytest.mark.asyncio
async def test_checkins_by_weekday(async_client: AsyncClient, db_session):
    admin_email = f'admin-weekday-{uuid4().hex}@test.com'
    admin_token, _ = await register_user(async_client, 'Admin Weekday', admin_email)
    await promote_to_admin(db_session, admin_email)

    response = await async_client.get(
        '/api/v1/dashboard/checkins/by-weekday',
        headers={'Authorization': f'Bearer {admin_token}'},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 7
    assert [entry['day'] for entry in data] == [
        'Dom',
        'Seg',
        'Ter',
        'Qua',
        'Qui',
        'Sex',
        'Sáb',
    ]
