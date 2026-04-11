from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.point_event import PointActionType, PointEvent
from app.models.redemption import Redemption, RedemptionStatus
from app.models.reward import Reward
from app.models.user import UserRole
from app.repositories.user_repo import UserRepository
from app.services.gamification_service import GamificationService


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


async def grant_points(db_session, user_id: str, amount: int) -> None:
    service = GamificationService(db_session, redis=None)
    await service.credit_points(
        user_id=user_id,
        action_type=PointActionType.ADMIN_ADJUSTMENT,
        points=amount,
        description='Carga de pontos para teste',
    )


@pytest.mark.asyncio
async def test_list_rewards(async_client: AsyncClient, db_session):
    user_token, _ = await register_user(
        async_client,
        'Aluno Rewards',
        f'aluno-rewards-{uuid4().hex}@test.com',
    )

    db_session.add_all(
        [
            Reward(name='Camiseta', cost_points=300, stock=10, is_active=True),
            Reward(name='Sem Estoque', cost_points=200, stock=0, is_active=True),
            Reward(name='Inativa', cost_points=150, stock=10, is_active=False),
            Reward(name='Ilimitada', cost_points=100, stock=None, is_active=True),
        ]
    )
    await db_session.commit()

    response = await async_client.get(
        '/api/v1/rewards/',
        headers={'Authorization': f'Bearer {user_token}'},
    )

    assert response.status_code == 200
    names = {item['name'] for item in response.json()}
    assert 'Camiseta' in names
    assert 'Ilimitada' in names
    assert 'Sem Estoque' not in names
    assert 'Inativa' not in names


@pytest.mark.asyncio
async def test_create_reward_admin(async_client: AsyncClient, db_session):
    admin_email = f'admin-create-{uuid4().hex}@test.com'
    admin_token, _ = await register_user(async_client, 'Admin Create', admin_email)
    await promote_to_role(db_session, admin_email, UserRole.ADMIN)

    response = await async_client.post(
        '/api/v1/rewards/',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={'name': 'Garrafa', 'cost_points': 250, 'stock': 20},
    )

    assert response.status_code == 201
    assert response.json()['name'] == 'Garrafa'


@pytest.mark.asyncio
async def test_create_reward_aluno_forbidden(async_client: AsyncClient):
    token, _ = await register_user(
        async_client,
        'Aluno Forbidden',
        f'aluno-forbidden-{uuid4().hex}@test.com',
    )

    response = await async_client.post(
        '/api/v1/rewards/',
        headers={'Authorization': f'Bearer {token}'},
        json={'name': 'Produto', 'cost_points': 50},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_redeem_success(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Redeem',
        f'aluno-redeem-{uuid4().hex}@test.com',
    )

    reward = Reward(name='Shake', cost_points=500, stock=5, is_active=True)
    db_session.add(reward)
    await db_session.commit()
    await db_session.refresh(reward)

    await grant_points(db_session, user_id, 1000)

    response = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 201
    data = response.json()
    assert data['status'] == 'pending'
    assert data['points_spent'] == 500

    user = await UserRepository(db_session).get_by_id(user_id)
    assert user is not None
    assert user.current_points == 500

    await db_session.refresh(reward)
    assert reward.stock == 4

    event_result = await db_session.execute(
        select(PointEvent).where(
            PointEvent.user_id == user_id,
            PointEvent.action_type == PointActionType.REDEMPTION,
            PointEvent.points == -500,
        )
    )
    assert event_result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_redeem_insufficient_points(async_client: AsyncClient, db_session):
    token, _ = await register_user(
        async_client,
        'Aluno Sem Pontos',
        f'aluno-sem-pontos-{uuid4().hex}@test.com',
    )

    reward = Reward(name='Mochila', cost_points=500, stock=3, is_active=True)
    db_session.add(reward)
    await db_session.commit()

    response = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_redeem_out_of_stock(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Estoque',
        f'aluno-estoque-{uuid4().hex}@test.com',
    )

    reward = Reward(name='Whey', cost_points=200, stock=0, is_active=True)
    db_session.add(reward)
    await db_session.commit()

    await grant_points(db_session, user_id, 1000)

    response = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_redeem_unlimited_stock(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Ilimitado',
        f'aluno-ilimitado-{uuid4().hex}@test.com',
    )

    reward = Reward(name='Aula Bonus', cost_points=100, stock=None, is_active=True)
    db_session.add(reward)
    await db_session.commit()

    await grant_points(db_session, user_id, 500)

    first = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {token}'},
    )
    second = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert first.status_code == 201
    assert second.status_code == 201
    await db_session.refresh(reward)
    assert reward.stock is None


@pytest.mark.asyncio
async def test_my_redemptions(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno Historico',
        f'aluno-historico-{uuid4().hex}@test.com',
    )

    reward = Reward(name='Toalha', cost_points=100, stock=2, is_active=True)
    db_session.add(reward)
    await db_session.commit()

    await grant_points(db_session, user_id, 300)

    redeem = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert redeem.status_code == 201

    response = await async_client.get(
        '/api/v1/rewards/my-redemptions',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(item['reward_id'] == reward.id for item in data)


@pytest.mark.asyncio
async def test_deliver_redemption(async_client: AsyncClient, db_session):
    admin_email = f'admin-deliver-{uuid4().hex}@test.com'
    admin_token, _ = await register_user(async_client, 'Admin Deliver', admin_email)
    await promote_to_role(db_session, admin_email, UserRole.ADMIN)

    aluno_token, user_id = await register_user(
        async_client,
        'Aluno Deliver',
        f'aluno-deliver-{uuid4().hex}@test.com',
    )

    reward = Reward(name='Boné', cost_points=120, stock=2, is_active=True)
    db_session.add(reward)
    await db_session.commit()

    await grant_points(db_session, user_id, 500)

    redeem = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {aluno_token}'},
    )
    redemption_id = redeem.json()['id']

    delivered = await async_client.post(
        f'/api/v1/rewards/admin/redemptions/{redemption_id}/deliver',
        headers={'Authorization': f'Bearer {admin_token}'},
    )

    assert delivered.status_code == 200
    assert delivered.json()['status'] == 'delivered'


@pytest.mark.asyncio
async def test_cancel_redemption(async_client: AsyncClient, db_session):
    admin_email = f'admin-cancel-{uuid4().hex}@test.com'
    admin_token, _ = await register_user(async_client, 'Admin Cancel', admin_email)
    await promote_to_role(db_session, admin_email, UserRole.ADMIN)

    aluno_token, user_id = await register_user(
        async_client,
        'Aluno Cancel',
        f'aluno-cancel-{uuid4().hex}@test.com',
    )

    reward = Reward(name='Luva', cost_points=200, stock=1, is_active=True)
    db_session.add(reward)
    await db_session.commit()

    await grant_points(db_session, user_id, 400)

    redeem = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {aluno_token}'},
    )
    redemption_id = redeem.json()['id']

    canceled = await async_client.post(
        f'/api/v1/rewards/admin/redemptions/{redemption_id}/cancel',
        headers={'Authorization': f'Bearer {admin_token}'},
    )

    assert canceled.status_code == 200
    assert canceled.json()['status'] == 'cancelled'

    user = await UserRepository(db_session).get_by_id(user_id)
    assert user is not None
    assert user.current_points == 400

    await db_session.refresh(reward)
    assert reward.stock == 1


@pytest.mark.asyncio
async def test_cancel_already_delivered(async_client: AsyncClient, db_session):
    admin_email = f'admin-cancel-delivered-{uuid4().hex}@test.com'
    admin_token, _ = await register_user(async_client, 'Admin CD', admin_email)
    await promote_to_role(db_session, admin_email, UserRole.ADMIN)

    aluno_token, user_id = await register_user(
        async_client,
        'Aluno Delivered',
        f'aluno-delivered-{uuid4().hex}@test.com',
    )

    reward = Reward(name='Bag', cost_points=100, stock=2, is_active=True)
    db_session.add(reward)
    await db_session.commit()

    await grant_points(db_session, user_id, 300)

    redeem = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {aluno_token}'},
    )
    redemption_id = redeem.json()['id']

    deliver = await async_client.post(
        f'/api/v1/rewards/admin/redemptions/{redemption_id}/deliver',
        headers={'Authorization': f'Bearer {admin_token}'},
    )
    assert deliver.status_code == 200

    cancel = await async_client.post(
        f'/api/v1/rewards/admin/redemptions/{redemption_id}/cancel',
        headers={'Authorization': f'Bearer {admin_token}'},
    )

    assert cancel.status_code == 400

    result = await db_session.execute(
        select(Redemption).where(Redemption.id == redemption_id)
    )
    redemption = result.scalar_one()
    assert redemption.status == RedemptionStatus.DELIVERED
