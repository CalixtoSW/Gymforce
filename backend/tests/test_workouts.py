from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.models.user import UserRole
from app.repositories.user_repo import UserRepository


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


async def promote_to_personal(db_session, email: str) -> None:
    repo = UserRepository(db_session)
    user = await repo.get_by_email(email)
    assert user is not None
    user.role = UserRole.PERSONAL
    await repo.update(user)


def sample_exercises() -> list[dict]:
    return [
        {
            "name": "Supino Reto",
            "sets": 4,
            "reps": "12",
            "rest_seconds": 60,
            "order": 1,
        },
        {
            "name": "Remada Curvada",
            "sets": 4,
            "reps": "10",
            "rest_seconds": 90,
            "order": 2,
        },
    ]


@pytest.mark.asyncio
async def test_create_sheet(async_client: AsyncClient, db_session):
    personal_email = f"personal-{uuid4().hex}@test.com"
    _, _ = await register_user(async_client, "Personal", personal_email)
    aluno_token, aluno_id = await register_user(
        async_client,
        "Aluno",
        f"aluno-{uuid4().hex}@test.com",
    )
    await promote_to_personal(db_session, personal_email)

    personal_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": personal_email, "password": "senhaforte123"},
    )
    personal_token = personal_login.json()["access_token"]

    response = await async_client.post(
        "/api/v1/workouts/sheets",
        headers={"Authorization": f"Bearer {personal_token}"},
        json={"user_id": aluno_id, "name": "Treino A", "exercises": sample_exercises()},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Treino A"
    assert len(data["exercises"]) == 2


@pytest.mark.asyncio
async def test_create_sheet_unauthorized(async_client: AsyncClient):
    aluno_token, aluno_id = await register_user(
        async_client,
        "Aluno Sem Permissao",
        f"aluno-noauth-{uuid4().hex}@test.com",
    )
    response = await async_client.post(
        "/api/v1/workouts/sheets",
        headers={"Authorization": f"Bearer {aluno_token}"},
        json={"user_id": aluno_id, "name": "Treino X", "exercises": sample_exercises()},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_my_sheets(async_client: AsyncClient, db_session):
    personal_email = f"personal-list-{uuid4().hex}@test.com"
    _, _ = await register_user(async_client, "Personal List", personal_email)
    aluno_token, aluno_id = await register_user(
        async_client,
        "Aluno List",
        f"aluno-list-{uuid4().hex}@test.com",
    )
    await promote_to_personal(db_session, personal_email)

    personal_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": personal_email, "password": "senhaforte123"},
    )
    personal_token = personal_login.json()["access_token"]

    await async_client.post(
        "/api/v1/workouts/sheets",
        headers={"Authorization": f"Bearer {personal_token}"},
        json={"user_id": aluno_id, "name": "Treino B", "exercises": sample_exercises()},
    )

    response = await async_client.get(
        "/api/v1/workouts/sheets",
        headers={"Authorization": f"Bearer {aluno_token}"},
    )

    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_complete_workout(async_client: AsyncClient, db_session):
    personal_email = f"personal-complete-{uuid4().hex}@test.com"
    _, _ = await register_user(async_client, "Personal Complete", personal_email)
    aluno_token, aluno_id = await register_user(
        async_client,
        "Aluno Complete",
        f"aluno-complete-{uuid4().hex}@test.com",
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
        json={"user_id": aluno_id, "name": "Treino C", "exercises": sample_exercises()},
    )
    sheet_id = created.json()["id"]

    response = await async_client.post(
        "/api/v1/workouts/complete",
        headers={"Authorization": f"Bearer {aluno_token}"},
        json={"sheet_id": sheet_id, "duration_minutes": 45},
    )

    assert response.status_code == 201
    assert response.json()["points_earned"] == 25


@pytest.mark.asyncio
async def test_workout_history(async_client: AsyncClient, db_session):
    personal_email = f"personal-history-{uuid4().hex}@test.com"
    _, _ = await register_user(async_client, "Personal History", personal_email)
    aluno_token, aluno_id = await register_user(
        async_client,
        "Aluno History",
        f"aluno-history-{uuid4().hex}@test.com",
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
        json={"user_id": aluno_id, "name": "Treino D", "exercises": sample_exercises()},
    )
    sheet_id = created.json()["id"]

    await async_client.post(
        "/api/v1/workouts/complete",
        headers={"Authorization": f"Bearer {aluno_token}"},
        json={"sheet_id": sheet_id, "duration_minutes": 30},
    )

    response = await async_client.get(
        "/api/v1/workouts/history",
        headers={"Authorization": f"Bearer {aluno_token}"},
    )

    assert response.status_code == 200
    assert len(response.json()) >= 1
