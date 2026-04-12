from datetime import date
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
    token = response.json()['access_token']

    me = await client.get('/api/v1/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert me.status_code == 200
    return token, me.json()['id']


async def promote_to_personal(db_session, email: str) -> None:
    repo = UserRepository(db_session)
    user = await repo.get_by_email(email)
    assert user is not None
    user.role = UserRole.PERSONAL
    await repo.update(user)


@pytest.mark.asyncio
async def test_create_assessment_personal(async_client: AsyncClient, db_session):
    personal_email = f'personal-assess-{uuid4().hex}@test.com'
    _, _ = await register_user(async_client, 'Personal', personal_email)
    aluno_token, aluno_id = await register_user(
        async_client,
        'Aluno',
        f'aluno-assess-{uuid4().hex}@test.com',
    )
    _ = aluno_token

    await promote_to_personal(db_session, personal_email)
    login = await async_client.post(
        '/api/v1/auth/login',
        json={'email': personal_email, 'password': 'senhaforte123'},
    )
    personal_token = login.json()['access_token']

    response = await async_client.post(
        '/api/v1/assessments/',
        headers={'Authorization': f'Bearer {personal_token}'},
        json={
            'user_id': aluno_id,
            'assessment_date': str(date.today()),
            'weight_kg': 80,
            'height_cm': 180,
            'body_fat_pct': 18,
        },
    )

    assert response.status_code == 201
    assert response.json()['bmi'] == pytest.approx(24.7)


@pytest.mark.asyncio
async def test_create_assessment_aluno_forbidden(async_client: AsyncClient):
    aluno_token, aluno_id = await register_user(
        async_client,
        'Aluno Forbidden',
        f'aluno-assess-forbidden-{uuid4().hex}@test.com',
    )

    response = await async_client.post(
        '/api/v1/assessments/',
        headers={'Authorization': f'Bearer {aluno_token}'},
        json={
            'user_id': aluno_id,
            'assessment_date': str(date.today()),
            'weight_kg': 75,
            'height_cm': 175,
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_my_assessments(async_client: AsyncClient, db_session):
    personal_email = f'personal-list-assess-{uuid4().hex}@test.com'
    _, _ = await register_user(async_client, 'Personal List', personal_email)
    aluno_token, aluno_id = await register_user(
        async_client,
        'Aluno List',
        f'aluno-list-assess-{uuid4().hex}@test.com',
    )

    await promote_to_personal(db_session, personal_email)
    login = await async_client.post(
        '/api/v1/auth/login',
        json={'email': personal_email, 'password': 'senhaforte123'},
    )
    personal_token = login.json()['access_token']

    await async_client.post(
        '/api/v1/assessments/',
        headers={'Authorization': f'Bearer {personal_token}'},
        json={
            'user_id': aluno_id,
            'assessment_date': str(date.today()),
            'weight_kg': 82,
            'height_cm': 180,
        },
    )

    history = await async_client.get(
        '/api/v1/assessments/history',
        headers={'Authorization': f'Bearer {aluno_token}'},
    )

    assert history.status_code == 200
    assert len(history.json()) >= 1


@pytest.mark.asyncio
async def test_evolution(async_client: AsyncClient, db_session):
    personal_email = f'personal-evolution-{uuid4().hex}@test.com'
    _, _ = await register_user(async_client, 'Personal Evolution', personal_email)
    aluno_token, aluno_id = await register_user(
        async_client,
        'Aluno Evolution',
        f'aluno-evolution-{uuid4().hex}@test.com',
    )

    await promote_to_personal(db_session, personal_email)
    login = await async_client.post(
        '/api/v1/auth/login',
        json={'email': personal_email, 'password': 'senhaforte123'},
    )
    personal_token = login.json()['access_token']

    await async_client.post(
        '/api/v1/assessments/',
        headers={'Authorization': f'Bearer {personal_token}'},
        json={
            'user_id': aluno_id,
            'assessment_date': '2026-04-01',
            'weight_kg': 90,
            'height_cm': 180,
            'waist_cm': 100,
        },
    )
    await async_client.post(
        '/api/v1/assessments/',
        headers={'Authorization': f'Bearer {personal_token}'},
        json={
            'user_id': aluno_id,
            'assessment_date': '2026-04-10',
            'weight_kg': 87,
            'height_cm': 180,
            'waist_cm': 96,
        },
    )

    evolution = await async_client.get(
        '/api/v1/assessments/evolution',
        headers={'Authorization': f'Bearer {aluno_token}'},
    )

    assert evolution.status_code == 200
    metrics = {item['metric'] for item in evolution.json()}
    assert 'weight_kg' in metrics
    assert 'waist_cm' in metrics


@pytest.mark.asyncio
async def test_bmi_calculation(async_client: AsyncClient, db_session):
    personal_email = f'personal-bmi-{uuid4().hex}@test.com'
    _, _ = await register_user(async_client, 'Personal BMI', personal_email)
    _, aluno_id = await register_user(
        async_client,
        'Aluno BMI',
        f'aluno-bmi-{uuid4().hex}@test.com',
    )

    await promote_to_personal(db_session, personal_email)
    login = await async_client.post(
        '/api/v1/auth/login',
        json={'email': personal_email, 'password': 'senhaforte123'},
    )
    personal_token = login.json()['access_token']

    response = await async_client.post(
        '/api/v1/assessments/',
        headers={'Authorization': f'Bearer {personal_token}'},
        json={
            'user_id': aluno_id,
            'assessment_date': str(date.today()),
            'weight_kg': 70,
            'height_cm': 175,
        },
    )

    assert response.status_code == 201
    assert response.json()['bmi'] == pytest.approx(22.9)
