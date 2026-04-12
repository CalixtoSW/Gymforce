from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

from app.models.badge import Badge
from app.models.checkin import Checkin
from app.models.point_event import PointActionType, PointEvent
from app.models.redemption import Redemption
from app.models.reward import Reward
from app.models.streak import UserStreak
from app.models.user_badge import UserBadge
from app.services.badge_service import BadgeService
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


async def seed_badges(db_session) -> None:
    badges_data = [
        ('early_bird', 'Madrugador', '5 check-ins antes das 7h', '🌅', 50, 'workout'),
        ('first_week', 'Primeira Semana', '3 treinos na primeira semana', '💪', 30, 'milestone'),
        ('streak_7', 'Streak Semanal', 'Manter streak de 7 dias', '🔥', 0, 'streak'),
        ('streak_30', 'Streak Mensal', 'Manter streak de 30 dias', '🔥', 0, 'streak'),
        ('unstoppable', 'Incansável', '30 treinos em um mês', '🏋️', 200, 'workout'),
        ('loyal_member', 'Fidelidade', '6 meses de matrícula contínua', '🎯', 500, 'milestone'),
        ('top_3_monthly', 'Top 3', 'Terminar no top 3 do ranking mensal', '🥇', 300, 'social'),
        ('tier_diamond', 'Diamante', 'Atingir tier Diamante', '💎', 0, 'milestone'),
        ('first_redeem', 'Primeiro Resgate', 'Fazer o primeiro resgate de recompensa', '🛒', 20, 'milestone'),
        ('hundred_checkins', 'Centenário', 'Completar 100 check-ins', '💯', 500, 'milestone'),
    ]
    for code, name, desc, icon, pts, category in badges_data:
        existing = await db_session.execute(select(Badge).where(Badge.code == code))
        if existing.scalar_one_or_none() is not None:
            continue
        db_session.add(
            Badge(
                code=code,
                name=name,
                description=desc,
                icon=icon,
                points_bonus=pts,
                category=category,
            )
        )
    await db_session.commit()


@pytest.mark.asyncio
async def test_get_badges_empty(async_client: AsyncClient, db_session):
    token, _ = await register_user(
        async_client,
        'Aluno Badge Empty',
        f'badge-empty-{uuid4().hex}@test.com',
    )
    await seed_badges(db_session)

    response = await async_client.get(
        '/api/v1/badges/',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    data = response.json()
    assert data['total_available'] >= 1
    assert data['total_earned'] == 0
    assert all(item['earned'] is False for item in data['badges'])


@pytest.mark.asyncio
async def test_badge_first_redeem(async_client: AsyncClient, db_session):
    token, user_id = await register_user(
        async_client,
        'Aluno First Redeem',
        f'badge-first-redeem-{uuid4().hex}@test.com',
    )
    await seed_badges(db_session)

    reward = Reward(name='Coqueteleira', cost_points=40, stock=10, is_active=True)
    db_session.add(reward)
    await db_session.commit()
    await db_session.refresh(reward)

    gamification = GamificationService(db_session, redis=None)
    await gamification.credit_points(
        user_id=user_id,
        action_type=PointActionType.ADMIN_ADJUSTMENT,
        points=100,
        description='Pontos para teste',
    )

    response = await async_client.post(
        f'/api/v1/rewards/{reward.id}/redeem',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 201

    query = await db_session.execute(
        select(UserBadge)
        .join(Badge, Badge.id == UserBadge.badge_id)
        .where(UserBadge.user_id == user_id, Badge.code == 'first_redeem')
    )
    assert query.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_badge_streak_7(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        'Aluno Streak 7',
        f'badge-streak7-{uuid4().hex}@test.com',
    )
    await seed_badges(db_session)

    streak = UserStreak(
        user_id=user_id,
        current_streak=7,
        longest_streak=7,
        last_activity_date=date.today(),
        freeze_available=True,
    )
    db_session.add(streak)
    await db_session.commit()

    service = BadgeService(db_session)
    await service.evaluate(user_id)

    query = await db_session.execute(
        select(UserBadge)
        .join(Badge, Badge.id == UserBadge.badge_id)
        .where(UserBadge.user_id == user_id, Badge.code == 'streak_7')
    )
    assert query.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_badge_no_duplicate(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        'Aluno No Dup',
        f'badge-dup-{uuid4().hex}@test.com',
    )
    await seed_badges(db_session)

    streak = UserStreak(
        user_id=user_id,
        current_streak=7,
        longest_streak=7,
        last_activity_date=date.today(),
        freeze_available=True,
    )
    db_session.add(streak)
    await db_session.commit()

    service = BadgeService(db_session)
    await service.evaluate(user_id)
    await service.evaluate(user_id)

    query = await db_session.execute(
        select(func.count(UserBadge.id))
        .join(Badge, Badge.id == UserBadge.badge_id)
        .where(UserBadge.user_id == user_id, Badge.code == 'streak_7')
    )
    assert query.scalar_one() == 1


@pytest.mark.asyncio
async def test_badge_points_bonus(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        'Aluno Bonus',
        f'badge-bonus-{uuid4().hex}@test.com',
    )
    await seed_badges(db_session)

    reward = Reward(name='Brinde', cost_points=10, stock=1, is_active=True)
    db_session.add(reward)
    await db_session.flush()

    redemption = Redemption(user_id=user_id, reward_id=reward.id, points_spent=10)
    db_session.add(redemption)
    await db_session.commit()

    service = BadgeService(db_session)
    await service.evaluate(user_id)

    user_events = await db_session.execute(
        select(PointEvent).where(
            PointEvent.user_id == user_id,
            PointEvent.action_type == PointActionType.CHALLENGE,
            PointEvent.points == 20,
        )
    )
    assert user_events.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_badge_hundred_checkins(async_client: AsyncClient, db_session):
    _, user_id = await register_user(
        async_client,
        'Aluno 100 Checkins',
        f'badge-100-{uuid4().hex}@test.com',
    )
    await seed_badges(db_session)

    for _ in range(100):
        db_session.add(Checkin(user_id=user_id, points_earned=10))
    await db_session.commit()

    service = BadgeService(db_session)
    await service.evaluate(user_id)

    query = await db_session.execute(
        select(UserBadge)
        .join(Badge, Badge.id == UserBadge.badge_id)
        .where(UserBadge.user_id == user_id, Badge.code == 'hundred_checkins')
    )
    assert query.scalar_one_or_none() is not None
