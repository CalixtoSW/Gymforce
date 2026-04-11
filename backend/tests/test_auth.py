import pytest
from httpx import AsyncClient

from app.models.user import UserRole
from app.repositories.user_repo import UserRepository


@pytest.mark.asyncio
async def test_register_success(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "João Silva",
            "email": "joao@test.com",
            "password": "senhaforte123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient):
    payload = {"name": "João", "email": "dup@test.com", "password": "senhaforte123"}
    await async_client.post("/api/v1/auth/register", json=payload)
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Maria",
            "email": "maria@test.com",
            "password": "senhaforte123",
        },
    )
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "maria@test.com", "password": "senhaforte123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test",
            "email": "wrong@test.com",
            "password": "senhaforte123",
        },
    )
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@test.com", "password": "errada"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(async_client: AsyncClient):
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Auth User",
            "email": "me@test.com",
            "password": "senhaforte123",
        },
    )
    token = reg.json()["access_token"]
    response = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@test.com"


@pytest.mark.asyncio
async def test_get_me_no_token(async_client: AsyncClient):
    response = await async_client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_refresh_token(async_client: AsyncClient):
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Refresh",
            "email": "refresh@test.com",
            "password": "senhaforte123",
        },
    )
    refresh = reg.json()["refresh_token"]
    response = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_users_list_forbidden_for_aluno(async_client: AsyncClient):
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Aluno",
            "email": "aluno@test.com",
            "password": "senhaforte123",
        },
    )
    token = reg.json()["access_token"]
    response = await async_client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_manage_users(async_client: AsyncClient, db_session):
    admin_reg = await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Admin",
            "email": "admin@test.com",
            "password": "senhaforte123",
        },
    )
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Target User",
            "email": "target@test.com",
            "password": "senhaforte123",
        },
    )

    repo = UserRepository(db_session)
    admin_user = await repo.get_by_email("admin@test.com")
    target_user = await repo.get_by_email("target@test.com")
    assert admin_user is not None
    assert target_user is not None

    admin_user.role = UserRole.ADMIN
    await repo.update(admin_user)

    admin_token = admin_reg.json()["access_token"]
    list_response = await async_client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert list_response.status_code == 200

    patch_response = await async_client.patch(
        f"/api/v1/users/{target_user.id}",
        json={"role": "personal"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["role"] == "personal"

    delete_response = await async_client.delete(
        f"/api/v1/users/{target_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert delete_response.status_code == 204
