from uuid import uuid4

import httpx
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.push_token import PushToken
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


async def promote_to_role(db_session, email: str, role: UserRole) -> None:
    repo = UserRepository(db_session)
    user = await repo.get_by_email(email)
    assert user is not None
    user.role = role
    await repo.update(user)


@pytest.mark.asyncio
async def test_register_push_token(async_client: AsyncClient):
    token, _ = await register_user(
        async_client,
        'Aluno Push',
        f'aluno-push-{uuid4().hex}@test.com',
    )

    response = await async_client.post(
        '/api/v1/notifications/register-token',
        headers={'Authorization': f'Bearer {token}'},
        json={'token': 'ExponentPushToken[test_register_token]', 'device_type': 'android'},
    )

    assert response.status_code == 201
    assert response.json()['token'] == 'ExponentPushToken[test_register_token]'


@pytest.mark.asyncio
async def test_register_duplicate_token(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Duplicate Token',
        f'aluno-dup-token-{uuid4().hex}@test.com',
    )

    payload = {'token': 'ExponentPushToken[test_duplicate_token]', 'device_type': 'ios'}
    first = await async_client.post(
        '/api/v1/notifications/register-token',
        headers={'Authorization': f'Bearer {token}'},
        json=payload,
    )
    second = await async_client.post(
        '/api/v1/notifications/register-token',
        headers={'Authorization': f'Bearer {token}'},
        json=payload,
    )

    assert first.status_code == 201
    assert second.status_code == 201

    result = await db_session.execute(
        select(PushToken).where(PushToken.user_id == user_id)
    )
    assert len(list(result.scalars().all())) == 1


@pytest.mark.asyncio
async def test_remove_token(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Remove Token',
        f'aluno-remove-token-{uuid4().hex}@test.com',
    )

    payload = {'token': 'ExponentPushToken[test_remove_token]', 'device_type': 'unknown'}
    await async_client.post(
        '/api/v1/notifications/register-token',
        headers={'Authorization': f'Bearer {token}'},
        json=payload,
    )

    response = await async_client.request(
        'DELETE',
        '/api/v1/notifications/remove-token',
        headers={'Authorization': f'Bearer {token}'},
        json=payload,
    )

    assert response.status_code == 200

    result = await db_session.execute(
        select(PushToken).where(PushToken.user_id == user_id)
    )
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_send_notification_admin(async_client: AsyncClient, db_session, monkeypatch):
    admin_email = f'admin-notify-{uuid4().hex}@test.com'
    admin_token, _ = await register_user(async_client, 'Admin Notify', admin_email)
    await promote_to_role(db_session, admin_email, UserRole.ADMIN)

    user_token, _ = await register_user(
        async_client,
        'Aluno Notificado',
        f'aluno-notify-{uuid4().hex}@test.com',
    )
    await async_client.post(
        '/api/v1/notifications/register-token',
        headers={'Authorization': f'Bearer {user_token}'},
        json={'token': 'ExponentPushToken[test_send_admin]', 'device_type': 'android'},
    )

    class DummyResponse:
        status_code = 200

    async def fake_post(self, *args, **kwargs):
        _ = (self, args, kwargs)
        return DummyResponse()

    monkeypatch.setattr(httpx.AsyncClient, 'post', fake_post)

    response = await async_client.post(
        '/api/v1/notifications/send',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={'title': 'Teste QA', 'body': 'Mensagem de teste'},
    )

    assert response.status_code == 200
    assert response.json()['sent'] >= 1


@pytest.mark.asyncio
async def test_send_notification_aluno_forbidden(async_client: AsyncClient):
    token, _ = await register_user(
        async_client,
        'Aluno Sem Permissao',
        f'aluno-forbidden-notify-{uuid4().hex}@test.com',
    )

    response = await async_client.post(
        '/api/v1/notifications/send',
        headers={'Authorization': f'Bearer {token}'},
        json={'title': 'Teste', 'body': 'Nao deve enviar'},
    )

    assert response.status_code == 403
