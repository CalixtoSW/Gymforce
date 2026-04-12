from datetime import date, timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import create_qr_token
from app.models.challenge import Challenge, ChallengeGoalType, UserChallenge
from app.models.membership import Membership, MembershipStatus
from app.models.plan import Plan
from app.models.point_event import PointActionType, PointEvent
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


async def promote_to_admin(db_session, email: str) -> None:
    repo = UserRepository(db_session)
    user = await repo.get_by_email(email)
    assert user is not None
    user.role = UserRole.ADMIN
    await repo.update(user)


async def create_active_membership(db_session, user_id: str) -> None:
    plan = Plan(name='Mensal', duration_days=30, price=99.9)
    db_session.add(plan)
    await db_session.commit()
    await db_session.refresh(plan)

    membership = Membership(
        user_id=user_id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=15),
        status=MembershipStatus.ACTIVE,
        payment_status='paid',
    )
    db_session.add(membership)
    await db_session.commit()


@pytest.mark.asyncio
async def test_list_active(async_client: AsyncClient, db_session):
    token, _ = await register_user(
        async_client,
        'Aluno Active',
        f'aluno-active-challenge-{uuid4().hex}@test.com',
    )

    db_session.add(
        Challenge(
            title='Treino Semanal',
            goal_type=ChallengeGoalType.WORKOUTS,
            goal_value=3,
            reward_points=100,
            start_date=date.today() - timedelta(days=1),
            end_date=date.today() + timedelta(days=7),
        )
    )
    await db_session.commit()

    response = await async_client.get(
        '/api/v1/challenges/',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_join_challenge(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Join',
        f'aluno-join-{uuid4().hex}@test.com',
    )
    _ = user_id

    challenge = Challenge(
        title='Checkins Semana',
        goal_type=ChallengeGoalType.CHECKINS,
        goal_value=5,
        reward_points=100,
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=7),
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)

    response = await async_client.post(
        f'/api/v1/challenges/{challenge.id}/join',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 201
    assert response.json()['message'] == 'Inscrito no desafio'


@pytest.mark.asyncio
async def test_join_duplicate(async_client: AsyncClient, db_session):
    token, _ = await register_user(
        async_client,
        'Aluno Duplicate',
        f'aluno-duplicate-{uuid4().hex}@test.com',
    )

    challenge = Challenge(
        title='Duplicate Challenge',
        goal_type=ChallengeGoalType.CHECKINS,
        goal_value=3,
        reward_points=50,
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=7),
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)

    first = await async_client.post(
        f'/api/v1/challenges/{challenge.id}/join',
        headers={'Authorization': f'Bearer {token}'},
    )
    second = await async_client.post(
        f'/api/v1/challenges/{challenge.id}/join',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert first.status_code == 201
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_join_expired(async_client: AsyncClient, db_session):
    token, _ = await register_user(
        async_client,
        'Aluno Expired',
        f'aluno-expired-{uuid4().hex}@test.com',
    )

    challenge = Challenge(
        title='Expired Challenge',
        goal_type=ChallengeGoalType.WORKOUTS,
        goal_value=1,
        reward_points=10,
        start_date=date.today() - timedelta(days=10),
        end_date=date.today() - timedelta(days=1),
        is_active=True,
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)

    response = await async_client.post(
        f'/api/v1/challenges/{challenge.id}/join',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_progress_update(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Progress',
        f'aluno-progress-{uuid4().hex}@test.com',
    )
    await create_active_membership(db_session, user_id)

    challenge = Challenge(
        title='Progress Challenge',
        goal_type=ChallengeGoalType.CHECKINS,
        goal_value=2,
        reward_points=30,
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=7),
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)

    join = await async_client.post(
        f'/api/v1/challenges/{challenge.id}/join',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert join.status_code == 201

    qr_token = create_qr_token(user_id)
    checkin = await async_client.post('/api/v1/checkins/', json={'qr_token': qr_token})
    assert checkin.status_code == 201

    my = await async_client.get(
        '/api/v1/challenges/my',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert my.status_code == 200
    assert my.json()[0]['progress'] >= 1


@pytest.mark.asyncio
async def test_challenge_complete(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Complete',
        f'aluno-complete-challenge-{uuid4().hex}@test.com',
    )
    await create_active_membership(db_session, user_id)

    challenge = Challenge(
        title='Complete Challenge',
        goal_type=ChallengeGoalType.CHECKINS,
        goal_value=1,
        reward_points=77,
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=7),
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)

    join = await async_client.post(
        f'/api/v1/challenges/{challenge.id}/join',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert join.status_code == 201

    qr_token = create_qr_token(user_id)
    checkin = await async_client.post('/api/v1/checkins/', json={'qr_token': qr_token})
    assert checkin.status_code == 201

    uc_result = await db_session.execute(
        select(UserChallenge).where(
            UserChallenge.user_id == user_id,
            UserChallenge.challenge_id == challenge.id,
        )
    )
    user_challenge = uc_result.scalar_one()
    assert user_challenge.completed is True

    event_result = await db_session.execute(
        select(PointEvent).where(
            PointEvent.user_id == user_id,
            PointEvent.action_type == PointActionType.CHALLENGE,
            PointEvent.ref_id == challenge.id,
        )
    )
    assert event_result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_my_challenges(async_client: AsyncClient, db_session):
    token, _ = await register_user(
        async_client,
        'Aluno My Challenges',
        f'aluno-my-challenges-{uuid4().hex}@test.com',
    )

    challenge = Challenge(
        title='My Challenge',
        goal_type=ChallengeGoalType.CHECKINS,
        goal_value=5,
        reward_points=50,
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=7),
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)

    join = await async_client.post(
        f'/api/v1/challenges/{challenge.id}/join',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert join.status_code == 201

    my = await async_client.get(
        '/api/v1/challenges/my',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert my.status_code == 200
    assert len(my.json()) >= 1
    assert 'progress_pct' in my.json()[0]


@pytest.mark.asyncio
async def test_create_challenge_admin(async_client: AsyncClient, db_session):
    admin_email = f'admin-challenge-{uuid4().hex}@test.com'
    admin_token, _ = await register_user(async_client, 'Admin Challenge', admin_email)
    await promote_to_admin(db_session, admin_email)

    response = await async_client.post(
        '/api/v1/challenges/',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={
            'title': 'Admin Created',
            'description': 'Criado via endpoint',
            'goal_type': 'workouts',
            'goal_value': 4,
            'reward_points': 40,
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=10)),
            'icon': '🎯',
        },
    )

    assert response.status_code == 201
    assert response.json()['title'] == 'Admin Created'
