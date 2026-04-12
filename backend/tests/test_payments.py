from datetime import date, timedelta
from uuid import uuid4
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.membership import Membership, MembershipStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.plan import Plan
from app.models.user import UserRole
from app.repositories.user_repo import UserRepository


@pytest.fixture
def mock_mp_sdk():
    with patch('app.services.payment_service.mercadopago.SDK') as mock_sdk:
        instance = mock_sdk.return_value
        instance.payment.return_value.create.return_value = {
            'status': 201,
            'response': {
                'id': 123456789,
                'status': 'pending',
                'point_of_interaction': {
                    'transaction_data': {
                        'qr_code': '00020126...pix-code',
                        'qr_code_base64': 'iVBORw0KGgo...base64',
                        'ticket_url': 'https://www.mercadopago.com.br/ticket',
                    }
                },
                'ticket_url': 'https://www.mercadopago.com.br/ticket',
                'date_of_expiration': '2026-04-12T12:00:00+00:00',
            },
        }
        instance.payment.return_value.get.return_value = {
            'status': 200,
            'response': {'id': 123456789, 'status': 'approved'},
        }
        yield instance


async def register_user(client: AsyncClient, name: str, email: str) -> tuple[str, str]:
    response = await client.post(
        '/api/v1/auth/register',
        json={'name': name, 'email': email, 'password': 'senhaforte123'},
    )
    assert response.status_code == 201
    token = response.json()['access_token']

    me = await client.get('/api/v1/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert me.status_code == 200
    return token, me.json()['id']


async def promote_to_role(db_session, email: str, role: UserRole) -> None:
    repo = UserRepository(db_session)
    user = await repo.get_by_email(email)
    assert user is not None
    user.role = role
    await repo.update(user)


async def set_user_points(db_session, user_id: str, points: int) -> None:
    repo = UserRepository(db_session)
    user = await repo.get_by_id(user_id)
    assert user is not None
    user.total_points = points
    user.current_points = points
    await repo.update(user)


async def create_plan(db_session, name: str = 'Mensal', price: float = 99.9) -> Plan:
    plan = Plan(name=name, duration_days=30, price=price, description='Plano teste')
    db_session.add(plan)
    await db_session.commit()
    await db_session.refresh(plan)
    return plan


@pytest.mark.asyncio
async def test_create_pix_payment(async_client: AsyncClient, db_session, mock_mp_sdk):
    token, _ = await register_user(async_client, 'Aluno Pix', f'aluno-pix-{uuid4().hex}@test.com')
    plan = await create_plan(db_session)

    response = await async_client.post(
        '/api/v1/payments/create-pix',
        headers={'Authorization': f'Bearer {token}'},
        json={'plan_id': plan.id, 'use_points_discount': False},
    )

    assert response.status_code == 201
    data = response.json()
    assert data['status'] == 'pending'
    assert data['qr_code'].startswith('000201')
    assert data['qr_code_base64'].startswith('iVBOR')


@pytest.mark.asyncio
async def test_create_pix_with_points_discount(
    async_client: AsyncClient,
    db_session,
    mock_mp_sdk,
):
    token, user_id = await register_user(
        async_client,
        'Aluno Desconto',
        f'aluno-desconto-{uuid4().hex}@test.com',
    )
    await set_user_points(db_session, user_id, 5000)
    plan = await create_plan(db_session, price=99.9)

    response = await async_client.post(
        '/api/v1/payments/create-pix',
        headers={'Authorization': f'Bearer {token}'},
        json={'plan_id': plan.id, 'use_points_discount': True},
    )

    assert response.status_code == 201
    data = response.json()
    assert data['discount_points'] == 2997
    assert data['discount_amount'] == pytest.approx(29.97)
    assert data['final_amount'] == pytest.approx(69.93)


@pytest.mark.asyncio
async def test_create_pix_plan_not_found(async_client: AsyncClient, mock_mp_sdk):
    token, _ = await register_user(
        async_client,
        'Aluno Not Found',
        f'aluno-plan-notfound-{uuid4().hex}@test.com',
    )

    response = await async_client.post(
        '/api/v1/payments/create-pix',
        headers={'Authorization': f'Bearer {token}'},
        json={'plan_id': str(uuid4()), 'use_points_discount': False},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_webhook_approved(async_client: AsyncClient, db_session, mock_mp_sdk):
    token, user_id = await register_user(
        async_client,
        'Aluno Webhook',
        f'aluno-webhook-{uuid4().hex}@test.com',
    )
    plan = await create_plan(db_session)

    create = await async_client.post(
        '/api/v1/payments/create-pix',
        headers={'Authorization': f'Bearer {token}'},
        json={'plan_id': plan.id, 'use_points_discount': False},
    )
    assert create.status_code == 201

    response = await async_client.post(
        '/api/v1/payments/webhook',
        json={'action': 'payment.updated', 'data': {'id': '123456789'}},
    )
    assert response.status_code == 200

    result = await db_session.execute(
        select(Payment).where(Payment.user_id == user_id)
    )
    payment = result.scalars().first()
    assert payment is not None
    assert payment.status == PaymentStatus.APPROVED

    m_result = await db_session.execute(
        select(Membership).where(Membership.user_id == user_id)
    )
    membership = m_result.scalars().first()
    assert membership is not None
    assert membership.status == MembershipStatus.ACTIVE


@pytest.mark.asyncio
async def test_webhook_approved_renewal(async_client: AsyncClient, db_session, mock_mp_sdk):
    token, user_id = await register_user(
        async_client,
        'Aluno Renovacao',
        f'aluno-renew-{uuid4().hex}@test.com',
    )
    plan = await create_plan(db_session, price=120.0)

    existing = Membership(
        user_id=user_id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=10),
        end_date=date.today() + timedelta(days=20),
        status=MembershipStatus.ACTIVE,
        payment_status='paid',
    )
    db_session.add(existing)
    await db_session.commit()

    create = await async_client.post(
        '/api/v1/payments/create-pix',
        headers={'Authorization': f'Bearer {token}'},
        json={'plan_id': plan.id, 'use_points_discount': False},
    )
    assert create.status_code == 201

    previous_end = existing.end_date

    webhook = await async_client.post(
        '/api/v1/payments/webhook',
        json={'action': 'payment.updated', 'data': {'id': '123456789'}},
    )
    assert webhook.status_code == 200

    await db_session.refresh(existing)
    assert existing.end_date == previous_end + timedelta(days=plan.duration_days)


@pytest.mark.asyncio
async def test_webhook_rejected(async_client: AsyncClient, db_session, mock_mp_sdk):
    mock_mp_sdk.payment.return_value.get.return_value = {
        'status': 200,
        'response': {'id': 123456789, 'status': 'rejected'},
    }

    token, user_id = await register_user(
        async_client,
        'Aluno Rejected',
        f'aluno-rejected-{uuid4().hex}@test.com',
    )
    plan = await create_plan(db_session)

    create = await async_client.post(
        '/api/v1/payments/create-pix',
        headers={'Authorization': f'Bearer {token}'},
        json={'plan_id': plan.id, 'use_points_discount': False},
    )
    assert create.status_code == 201

    webhook = await async_client.post(
        '/api/v1/payments/webhook',
        json={'action': 'payment.updated', 'data': {'id': '123456789'}},
    )
    assert webhook.status_code == 200

    result = await db_session.execute(
        select(Payment).where(Payment.user_id == user_id)
    )
    payment = result.scalars().first()
    assert payment is not None
    assert payment.status == PaymentStatus.REJECTED


@pytest.mark.asyncio
async def test_webhook_unknown_payment(async_client: AsyncClient):
    response = await async_client.post(
        '/api/v1/payments/webhook',
        json={'action': 'payment.updated', 'data': {'id': '999999'}},
    )

    assert response.status_code == 200
    assert response.json()['status'] == 'processed'


@pytest.mark.asyncio
async def test_get_my_membership(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Membership',
        f'aluno-membership-{uuid4().hex}@test.com',
    )
    plan = await create_plan(db_session)

    membership = Membership(
        user_id=user_id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=5),
        end_date=date.today() + timedelta(days=25),
        status=MembershipStatus.ACTIVE,
        payment_status='paid',
    )
    db_session.add(membership)
    await db_session.commit()

    response = await async_client.get(
        '/api/v1/payments/my-membership',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'active'
    assert data['days_remaining'] >= 0


@pytest.mark.asyncio
async def test_get_my_membership_none(async_client: AsyncClient):
    token, _ = await register_user(
        async_client,
        'Aluno Sem Membership',
        f'aluno-no-membership-{uuid4().hex}@test.com',
    )

    response = await async_client.get(
        '/api/v1/payments/my-membership',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert response.json() is None


@pytest.mark.asyncio
async def test_payment_history(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno History',
        f'aluno-history-pay-{uuid4().hex}@test.com',
    )
    plan = await create_plan(db_session)

    db_session.add_all(
        [
            Payment(
                user_id=user_id,
                plan_id=plan.id,
                amount=99.9,
                discount_points=0,
                discount_amount=0,
                final_amount=99.9,
                method=PaymentMethod.PIX,
                status=PaymentStatus.PENDING,
                mp_payment_id='1001',
            ),
            Payment(
                user_id=user_id,
                plan_id=plan.id,
                amount=99.9,
                discount_points=0,
                discount_amount=0,
                final_amount=99.9,
                method=PaymentMethod.PIX,
                status=PaymentStatus.APPROVED,
                mp_payment_id='1002',
            ),
        ]
    )
    await db_session.commit()

    response = await async_client.get(
        '/api/v1/payments/history',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_plans_with_discount(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Plan Discount',
        f'aluno-plan-discount-{uuid4().hex}@test.com',
    )
    await set_user_points(db_session, user_id, 5000)
    await create_plan(db_session, name='Mensal Gold', price=99.9)

    response = await async_client.get(
        '/api/v1/payments/plans',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    first = response.json()[0]
    assert first['discount_points'] == 2997
    assert first['final_price_with_discount'] == pytest.approx(69.93)


@pytest.mark.asyncio
async def test_expire_overdue(async_client: AsyncClient, db_session):
    admin_email = f'admin-expire-{uuid4().hex}@test.com'
    admin_token, user_id = await register_user(async_client, 'Admin Expire', admin_email)
    await promote_to_role(db_session, admin_email, UserRole.ADMIN)
    plan = await create_plan(db_session)

    overdue = Membership(
        user_id=user_id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=60),
        end_date=date.today() - timedelta(days=1),
        status=MembershipStatus.ACTIVE,
        payment_status='overdue',
    )
    current = Membership(
        user_id=user_id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=2),
        end_date=date.today() + timedelta(days=28),
        status=MembershipStatus.ACTIVE,
        payment_status='paid',
    )
    db_session.add_all([overdue, current])
    await db_session.commit()

    response = await async_client.post(
        '/api/v1/payments/admin/expire-overdue',
        headers={'Authorization': f'Bearer {admin_token}'},
    )

    assert response.status_code == 200
    assert response.json()['expired_count'] >= 1

    await db_session.refresh(overdue)
    await db_session.refresh(current)
    assert overdue.status == MembershipStatus.EXPIRED
    assert current.status == MembershipStatus.ACTIVE
