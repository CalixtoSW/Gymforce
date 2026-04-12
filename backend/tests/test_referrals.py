from datetime import date, timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import create_qr_token
from app.models.membership import Membership, MembershipStatus
from app.models.plan import Plan
from app.models.referral import Referral, ReferralStatus
from app.repositories.user_repo import UserRepository


async def register_user(
    client: AsyncClient,
    name: str,
    email: str,
    referral_code: str | None = None,
) -> tuple[str, str]:
    payload = {
        'name': name,
        'email': email,
        'password': 'senhaforte123',
    }
    if referral_code:
        payload['referral_code'] = referral_code

    response = await client.post('/api/v1/auth/register', json=payload)
    assert response.status_code == 201
    token = response.json()['access_token']

    me = await client.get('/api/v1/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert me.status_code == 200
    return token, me.json()['id']


async def create_active_membership(db_session, user_id: str) -> None:
    plan = Plan(name='Mensal Referral', duration_days=30, price=99.9)
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
async def test_get_my_code(async_client: AsyncClient):
    token, _ = await register_user(
        async_client,
        'Referrer',
        f'referrer-code-{uuid4().hex}@test.com',
    )

    response = await async_client.get(
        '/api/v1/referrals/my-stats',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert response.json()['referral_code'].startswith('GYM')


@pytest.mark.asyncio
async def test_register_with_referral(async_client: AsyncClient, db_session):
    referrer_token, referrer_id = await register_user(
        async_client,
        'Referrer Register',
        f'referrer-register-{uuid4().hex}@test.com',
    )

    stats = await async_client.get(
        '/api/v1/referrals/my-stats',
        headers={'Authorization': f'Bearer {referrer_token}'},
    )
    code = stats.json()['referral_code']

    await register_user(
        async_client,
        'Referred User',
        f'referred-register-{uuid4().hex}@test.com',
        referral_code=code,
    )

    repo = UserRepository(db_session)
    referrer = await repo.get_by_id(referrer_id)
    assert referrer is not None
    assert referrer.current_points >= 100


@pytest.mark.asyncio
async def test_first_checkin_activates(async_client: AsyncClient, db_session):
    referrer_token, referrer_id = await register_user(
        async_client,
        'Referrer Activate',
        f'referrer-activate-{uuid4().hex}@test.com',
    )

    stats = await async_client.get(
        '/api/v1/referrals/my-stats',
        headers={'Authorization': f'Bearer {referrer_token}'},
    )
    code = stats.json()['referral_code']

    _, referred_id = await register_user(
        async_client,
        'Referred Activate',
        f'referred-activate-{uuid4().hex}@test.com',
        referral_code=code,
    )
    await create_active_membership(db_session, referred_id)

    qr_token = create_qr_token(referred_id)
    checkin = await async_client.post('/api/v1/checkins/', json={'qr_token': qr_token})
    assert checkin.status_code == 201

    referral_result = await db_session.execute(
        select(Referral).where(Referral.referred_user_id == referred_id)
    )
    referral = referral_result.scalar_one_or_none()
    assert referral is not None
    assert referral.status == ReferralStatus.ACTIVATED

    repo = UserRepository(db_session)
    referrer = await repo.get_by_id(referrer_id)
    assert referrer is not None
    assert referrer.current_points >= 200


@pytest.mark.asyncio
async def test_invalid_code_ignored(async_client: AsyncClient, db_session):
    _, referred_id = await register_user(
        async_client,
        'Referred Invalid',
        f'referred-invalid-{uuid4().hex}@test.com',
        referral_code='INVALID-CODE',
    )

    result = await db_session.execute(
        select(Referral).where(Referral.referred_user_id == referred_id)
    )
    assert result.scalar_one_or_none() is None
