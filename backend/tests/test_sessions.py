from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.models.user import UserRole
from app.repositories.user_repo import UserRepository


def _unique_email(prefix: str) -> str:
    return f'{prefix}-{uuid4().hex}@test.com'


async def register_user(client: AsyncClient, name: str, email: str) -> tuple[str, str]:
    response = await client.post(
        '/api/v1/auth/register',
        json={'name': name, 'email': email, 'password': 'senhaforte123'},
    )
    assert response.status_code == 201
    token = response.json()['access_token']

    me = await client.get(
        '/api/v1/auth/me', headers={'Authorization': f'Bearer {token}'}
    )
    assert me.status_code == 200
    return token, me.json()['id']


async def promote_role(db_session, email: str, role: UserRole) -> None:
    repo = UserRepository(db_session)
    user = await repo.get_by_email(email)
    assert user is not None
    user.role = role
    await repo.update(user)


async def create_sheet_for_user(
    client: AsyncClient,
    personal_token: str,
    student_id: str,
    sets: int = 4,
) -> dict:
    response = await client.post(
        '/api/v1/workouts/sheets',
        headers={'Authorization': f'Bearer {personal_token}'},
        json={
            'user_id': student_id,
            'name': 'Treino Sessao',
            'exercises': [
                {
                    'name': 'Supino Reto',
                    'sets': sets,
                    'reps': '12',
                    'rest_seconds': 60,
                    'order': 1,
                },
                {
                    'name': 'Remada Curvada',
                    'sets': sets,
                    'reps': '10',
                    'rest_seconds': 90,
                    'order': 2,
                },
            ],
        },
    )
    assert response.status_code == 201
    return response.json()


async def start_session(client: AsyncClient, student_token: str, sheet_id: str) -> dict:
    response = await client.post(
        '/api/v1/sessions/start',
        headers={'Authorization': f'Bearer {student_token}'},
        json={'sheet_id': sheet_id},
    )
    assert response.status_code == 201
    return response.json()


async def setup_base(async_client: AsyncClient, db_session):
    personal_email = _unique_email('personal-session')
    student_email = _unique_email('student-session')

    _, _ = await register_user(async_client, 'Personal', personal_email)
    student_token, student_id = await register_user(
        async_client, 'Aluno', student_email
    )

    await promote_role(db_session, personal_email, UserRole.PERSONAL)

    personal_login = await async_client.post(
        '/api/v1/auth/login',
        json={'email': personal_email, 'password': 'senhaforte123'},
    )
    assert personal_login.status_code == 200
    personal_token = personal_login.json()['access_token']

    sheet = await create_sheet_for_user(async_client, personal_token, student_id)
    return student_token, student_id, personal_token, sheet


async def log_completed_set(
    client: AsyncClient,
    token: str,
    session_id: str,
    exercise_id: str,
    set_number: int,
    weight: float | None = None,
):
    payload = {
        'exercise_id': exercise_id,
        'set_number': set_number,
        'actual_reps': 12,
        'status': 'completed',
    }
    if weight is not None:
        payload['actual_weight_kg'] = weight

    response = await client.post(
        f'/api/v1/sessions/{session_id}/log-set',
        headers={'Authorization': f'Bearer {token}'},
        json=payload,
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_start_session(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    data = await start_session(async_client, token, sheet['id'])

    assert data['status'] == 'active'
    assert data['total_sets_planned'] == 8


@pytest.mark.asyncio
async def test_start_duplicate(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    first = await async_client.post(
        '/api/v1/sessions/start',
        headers={'Authorization': f'Bearer {token}'},
        json={'sheet_id': sheet['id']},
    )
    second = await async_client.post(
        '/api/v1/sessions/start',
        headers={'Authorization': f'Bearer {token}'},
        json={'sheet_id': sheet['id']},
    )

    assert first.status_code == 201
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_pause_session(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])

    response = await async_client.post(
        f"/api/v1/sessions/{session['id']}/pause",
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert response.json()['status'] == 'paused'
    assert response.json()['paused_at'] is not None


@pytest.mark.asyncio
async def test_resume_session(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])

    pause = await async_client.post(
        f"/api/v1/sessions/{session['id']}/pause",
        headers={'Authorization': f'Bearer {token}'},
    )
    assert pause.status_code == 200

    resume = await async_client.post(
        f"/api/v1/sessions/{session['id']}/resume",
        headers={'Authorization': f'Bearer {token}'},
    )

    assert resume.status_code == 200
    assert resume.json()['status'] == 'active'
    assert resume.json()['total_pause_seconds'] >= 0


@pytest.mark.asyncio
async def test_double_pause(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])

    first = await async_client.post(
        f"/api/v1/sessions/{session['id']}/pause",
        headers={'Authorization': f'Bearer {token}'},
    )
    second = await async_client.post(
        f"/api/v1/sessions/{session['id']}/pause",
        headers={'Authorization': f'Bearer {token}'},
    )

    assert first.status_code == 200
    assert second.status_code == 400


@pytest.mark.asyncio
async def test_log_set_completed(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])
    exercise = sheet['exercises'][0]

    created = await log_completed_set(
        async_client, token, session['id'], exercise['id'], 1
    )
    assert created['status'] == 'completed'

    detail = await async_client.get(
        f"/api/v1/sessions/{session['id']}",
        headers={'Authorization': f'Bearer {token}'},
    )
    assert detail.status_code == 200
    assert detail.json()['completion_pct'] == 12


@pytest.mark.asyncio
async def test_log_set_skipped(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])
    exercise = sheet['exercises'][0]

    response = await async_client.post(
        f"/api/v1/sessions/{session['id']}/log-set",
        headers={'Authorization': f'Bearer {token}'},
        json={
            'exercise_id': exercise['id'],
            'set_number': 1,
            'status': 'skipped',
        },
    )
    assert response.status_code == 201

    detail = await async_client.get(
        f"/api/v1/sessions/{session['id']}",
        headers={'Authorization': f'Bearer {token}'},
    )
    assert detail.status_code == 200
    assert detail.json()['total_sets_skipped'] == 1


@pytest.mark.asyncio
async def test_log_set_with_weight(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])
    exercise = sheet['exercises'][0]

    response = await async_client.post(
        f"/api/v1/sessions/{session['id']}/log-set",
        headers={'Authorization': f'Bearer {token}'},
        json={
            'exercise_id': exercise['id'],
            'set_number': 1,
            'actual_reps': 10,
            'actual_weight_kg': 42.5,
            'status': 'completed',
        },
    )

    assert response.status_code == 201
    assert response.json()['actual_weight_kg'] == 42.5


@pytest.mark.asyncio
async def test_suggested_weight(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    exercise = sheet['exercises'][0]

    first = await start_session(async_client, token, sheet['id'])
    await log_completed_set(async_client, token, first['id'], exercise['id'], 1, 50.0)
    finish_first = await async_client.post(
        f"/api/v1/sessions/{first['id']}/finish",
        headers={'Authorization': f'Bearer {token}'},
        json={'completion_type': 'partial', 'partial_reason': 'fatigue'},
    )
    assert finish_first.status_code == 200

    second = await start_session(async_client, token, sheet['id'])
    response = await async_client.post(
        f"/api/v1/sessions/{second['id']}/log-set",
        headers={'Authorization': f'Bearer {token}'},
        json={
            'exercise_id': exercise['id'],
            'set_number': 1,
            'actual_reps': 12,
            'status': 'completed',
        },
    )

    assert response.status_code == 201
    assert response.json()['planned_weight_kg'] == 50.0


@pytest.mark.asyncio
async def test_finish_complete(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])

    for exercise in sheet['exercises']:
        for set_number in range(1, exercise['sets'] + 1):
            await log_completed_set(
                async_client, token, session['id'], exercise['id'], set_number
            )

    response = await async_client.post(
        f"/api/v1/sessions/{session['id']}/finish",
        headers={'Authorization': f'Bearer {token}'},
        json={'completion_type': 'complete'},
    )

    assert response.status_code == 200
    assert response.json()['status'] == 'completed'
    assert response.json()['points_earned'] == 25


@pytest.mark.asyncio
async def test_finish_partial(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])

    # 7 de 8 séries = 87% → parcial por tipo solicitado
    logs_done = 0
    for exercise in sheet['exercises']:
        for set_number in range(1, exercise['sets'] + 1):
            if logs_done == 7:
                break
            await log_completed_set(
                async_client, token, session['id'], exercise['id'], set_number
            )
            logs_done += 1

    response = await async_client.post(
        f"/api/v1/sessions/{session['id']}/finish",
        headers={'Authorization': f'Bearer {token}'},
        json={'completion_type': 'partial', 'partial_reason': 'fatigue'},
    )

    assert response.status_code == 200
    assert response.json()['status'] == 'partial'
    assert response.json()['points_earned'] == 21


@pytest.mark.asyncio
async def test_finish_partial_no_reason(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])
    exercise = sheet['exercises'][0]
    await log_completed_set(async_client, token, session['id'], exercise['id'], 1)

    response = await async_client.post(
        f"/api/v1/sessions/{session['id']}/finish",
        headers={'Authorization': f'Bearer {token}'},
        json={'completion_type': 'partial'},
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_finish_below_minimum(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])

    exercise = sheet['exercises'][0]
    await log_completed_set(async_client, token, session['id'], exercise['id'], 1)
    await log_completed_set(async_client, token, session['id'], exercise['id'], 2)

    response = await async_client.post(
        f"/api/v1/sessions/{session['id']}/finish",
        headers={'Authorization': f'Bearer {token}'},
        json={'completion_type': 'partial', 'partial_reason': 'time'},
    )

    assert response.status_code == 200
    assert response.json()['points_earned'] == 0


@pytest.mark.asyncio
async def test_finish_cancelled(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])

    response = await async_client.post(
        f"/api/v1/sessions/{session['id']}/finish",
        headers={'Authorization': f'Bearer {token}'},
        json={'completion_type': 'partial', 'partial_reason': 'time'},
    )

    assert response.status_code == 200
    assert response.json()['status'] == 'cancelled'
    assert response.json()['points_earned'] == 0


@pytest.mark.asyncio
async def test_personal_sees_active_sessions(async_client: AsyncClient, db_session):
    token, _, personal_token, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])
    exercise = sheet['exercises'][0]
    await log_completed_set(async_client, token, session['id'], exercise['id'], 1)

    response = await async_client.get(
        '/api/v1/sessions/personal/active',
        headers={'Authorization': f'Bearer {personal_token}'},
    )

    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]['current_exercise'] == exercise['name']


@pytest.mark.asyncio
async def test_personal_finishes_session(async_client: AsyncClient, db_session):
    token, _, personal_token, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])

    response = await async_client.post(
        '/api/v1/sessions/personal/finish',
        headers={'Authorization': f'Bearer {personal_token}'},
        json={
            'session_id': session['id'],
            'completion_type': 'partial',
            'partial_reason': 'personal',
        },
    )

    assert response.status_code == 200
    assert response.json()['finished_by'] is not None
    assert response.json()['status'] == 'cancelled'


@pytest.mark.asyncio
async def test_aluno_cannot_see_personal_endpoints(
    async_client: AsyncClient, db_session
):
    token, _, _, _ = await setup_base(async_client, db_session)

    response = await async_client.get(
        '/api/v1/sessions/personal/active',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_active_session(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    session = await start_session(async_client, token, sheet['id'])
    exercise = sheet['exercises'][0]
    await log_completed_set(async_client, token, session['id'], exercise['id'], 1)

    response = await async_client.get(
        '/api/v1/sessions/active',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert response.json()['id'] == session['id']
    assert len(response.json()['exercises_progress']) == 2


@pytest.mark.asyncio
async def test_session_history(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)

    first = await start_session(async_client, token, sheet['id'])
    await async_client.post(
        f"/api/v1/sessions/{first['id']}/finish",
        headers={'Authorization': f'Bearer {token}'},
        json={'completion_type': 'partial', 'partial_reason': 'time'},
    )

    second = await start_session(async_client, token, sheet['id'])
    await async_client.post(
        f"/api/v1/sessions/{second['id']}/finish",
        headers={'Authorization': f'Bearer {token}'},
        json={'completion_type': 'partial', 'partial_reason': 'fatigue'},
    )

    response = await async_client.get(
        '/api/v1/sessions/?skip=0&limit=1',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_weight_history(async_client: AsyncClient, db_session):
    token, _, _, sheet = await setup_base(async_client, db_session)
    exercise = sheet['exercises'][0]

    session = await start_session(async_client, token, sheet['id'])
    await log_completed_set(async_client, token, session['id'], exercise['id'], 1, 45.0)
    await async_client.post(
        f"/api/v1/sessions/{session['id']}/finish",
        headers={'Authorization': f'Bearer {token}'},
        json={'completion_type': 'partial', 'partial_reason': 'fatigue'},
    )

    response = await async_client.get(
        f"/api/v1/sessions/exercises/{exercise['id']}/weight-history",
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]['weight_kg'] == 45.0
