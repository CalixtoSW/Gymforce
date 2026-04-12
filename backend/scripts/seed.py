"""
GymForce - Seed de dados para QA/Beta
Uso: cd backend && python -m scripts.seed
"""
import asyncio
from datetime import date, timedelta
from uuid import uuid4

from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models import Base
from app.models.membership import Membership, MembershipStatus
from app.models.plan import Plan
from app.models.reward import Reward
from app.models.streak import UserStreak
from app.models.user import User, UserRole, UserTier
from app.models.workout import Exercise, WorkoutSheet


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print('Iniciando seed...')

        planos = [
            Plan(
                id=str(uuid4()),
                name='Mensal',
                duration_days=30,
                price=99.90,
                description='Plano mensal basico',
            ),
            Plan(
                id=str(uuid4()),
                name='Trimestral',
                duration_days=90,
                price=249.90,
                description='3 meses com desconto',
            ),
            Plan(
                id=str(uuid4()),
                name='Semestral',
                duration_days=180,
                price=449.90,
                description='6 meses - melhor custo',
            ),
            Plan(
                id=str(uuid4()),
                name='Anual',
                duration_days=365,
                price=799.90,
                description='1 ano completo',
            ),
        ]
        for plano in planos:
            db.add(plano)
        await db.flush()
        print(f'{len(planos)} planos criados')

        senha_padrao = hash_password('Teste@123')

        admin = User(
            id=str(uuid4()),
            name='Admin GymForce',
            email='admin@gymforce.app',
            hashed_password=senha_padrao,
            role=UserRole.ADMIN,
            tier=UserTier.LENDA,
            total_points=99999,
            current_points=99999,
            streak_count=0,
        )
        personal = User(
            id=str(uuid4()),
            name='Carlos Personal',
            email='carlos@gymforce.app',
            hashed_password=senha_padrao,
            role=UserRole.PERSONAL,
            tier=UserTier.OURO,
            total_points=8000,
            current_points=8000,
            streak_count=5,
        )
        recepcao = User(
            id=str(uuid4()),
            name='Ana Recepcao',
            email='ana@gymforce.app',
            hashed_password=senha_padrao,
            role=UserRole.RECEPCAO,
            tier=UserTier.BRONZE,
            total_points=0,
            current_points=0,
            streak_count=0,
        )

        alunos = []
        alunos_data = [
            ('Joao Silva', 'joao@email.com', UserTier.OURO, 7200, 5800, 12),
            ('Maria Santos', 'maria@email.com', UserTier.PRATA, 3500, 2100, 8),
            ('Pedro Souza', 'pedro@email.com', UserTier.DIAMANTE, 18000, 15200, 25),
            ('Fernanda Lima', 'fernanda@email.com', UserTier.BRONZE, 450, 450, 3),
            ('Lucas Oliveira', 'lucas@email.com', UserTier.PRATA, 2800, 1600, 0),
            ('Camila Costa', 'camila@email.com', UserTier.OURO, 9500, 7300, 15),
            ('Rafael Mendes', 'rafael@email.com', UserTier.BRONZE, 120, 120, 1),
            ('Juliana Rocha', 'juliana@email.com', UserTier.PRATA, 4100, 3900, 6),
            ('Thiago Ferreira', 'thiago@email.com', UserTier.OURO, 6300, 4000, 10),
            ('Beatriz Almeida', 'beatriz@email.com', UserTier.DIAMANTE, 22000, 19500, 30),
        ]
        for name, email, tier, total, current, streak in alunos_data:
            aluno = User(
                id=str(uuid4()),
                name=name,
                email=email,
                hashed_password=senha_padrao,
                role=UserRole.ALUNO,
                tier=tier,
                total_points=total,
                current_points=current,
                streak_count=streak,
            )
            alunos.append(aluno)

        for usuario in [admin, personal, recepcao] + alunos:
            db.add(usuario)
        await db.flush()
        print(f'{3 + len(alunos)} usuarios criados')

        today = date.today()
        for aluno in alunos:
            membership = Membership(
                id=str(uuid4()),
                user_id=aluno.id,
                plan_id=planos[0].id,
                start_date=today - timedelta(days=15),
                end_date=today + timedelta(days=15),
                status=MembershipStatus.ACTIVE,
                payment_status='paid',
            )
            db.add(membership)
        await db.flush()
        print(f'{len(alunos)} matriculas ativas criadas')

        for aluno in alunos:
            if aluno.streak_count > 0:
                streak = UserStreak(
                    id=str(uuid4()),
                    user_id=aluno.id,
                    current_streak=aluno.streak_count,
                    longest_streak=aluno.streak_count + 5,
                    last_activity_date=today - timedelta(days=1),
                    freeze_available=True,
                )
                db.add(streak)
        await db.flush()
        print('Streaks criados')

        fichas_config = [
            (
                'Treino A - Peito/Triceps',
                [
                    ('Supino Reto', 4, '12', 60),
                    ('Supino Inclinado Halteres', 3, '10', 60),
                    ('Crucifixo', 3, '15', 45),
                    ('Triceps Pulley', 4, '12', 45),
                    ('Triceps Frances', 3, '10', 45),
                    ('Mergulho', 3, 'ate falha', 60),
                ],
            ),
            (
                'Treino B - Costas/Biceps',
                [
                    ('Puxada Frontal', 4, '12', 60),
                    ('Remada Curvada', 4, '10', 60),
                    ('Remada Unilateral', 3, '12', 45),
                    ('Rosca Direta', 4, '12', 45),
                    ('Rosca Martelo', 3, '10', 45),
                    ('Rosca Concentrada', 3, '12', 45),
                ],
            ),
            (
                'Treino C - Pernas/Ombros',
                [
                    ('Agachamento Livre', 4, '10', 90),
                    ('Leg Press 45', 4, '12', 60),
                    ('Cadeira Extensora', 3, '15', 45),
                    ('Mesa Flexora', 3, '12', 45),
                    ('Desenvolvimento Militar', 4, '10', 60),
                    ('Elevacao Lateral', 3, '15', 45),
                    ('Panturrilha', 4, '20', 30),
                ],
            ),
        ]

        for aluno in alunos[:6]:
            for sheet_name, exercicios in fichas_config:
                sheet = WorkoutSheet(
                    id=str(uuid4()),
                    user_id=aluno.id,
                    created_by=personal.id,
                    name=sheet_name,
                )
                db.add(sheet)
                await db.flush()
                for order, (ex_name, sets, reps, rest) in enumerate(exercicios):
                    ex = Exercise(
                        id=str(uuid4()),
                        sheet_id=sheet.id,
                        name=ex_name,
                        sets=sets,
                        reps=reps,
                        rest_seconds=rest,
                        order=order,
                    )
                    db.add(ex)
        await db.flush()
        print('Fichas de treino criadas (6 alunos x 3 fichas)')

        rewards = [
            Reward(
                id=str(uuid4()),
                name='Camiseta GymForce',
                description='Camiseta exclusiva dry-fit',
                cost_points=500,
                stock=20,
                category='produto',
            ),
            Reward(
                id=str(uuid4()),
                name='Squeeze 750ml',
                description='Garrafa termica personalizada',
                cost_points=300,
                stock=15,
                category='produto',
            ),
            Reward(
                id=str(uuid4()),
                name='Sessao com Personal',
                description='1h de treino personalizado',
                cost_points=1000,
                stock=None,
                category='servico',
            ),
            Reward(
                id=str(uuid4()),
                name='Desconto 10% Mensalidade',
                description='Valido no proximo mes',
                cost_points=2000,
                stock=10,
                category='desconto',
            ),
            Reward(
                id=str(uuid4()),
                name='Day Pass Convidado',
                description='Traga um amigo por 1 dia',
                cost_points=300,
                stock=None,
                category='servico',
            ),
            Reward(
                id=str(uuid4()),
                name='Kit Suplemento',
                description='Whey + Creatina amostra',
                cost_points=1500,
                stock=5,
                category='produto',
            ),
            Reward(
                id=str(uuid4()),
                name='Toalha GymForce',
                description='Toalha de treino bordada',
                cost_points=400,
                stock=30,
                category='produto',
            ),
            Reward(
                id=str(uuid4()),
                name='Acesso Area VIP',
                description='1 mes de acesso a sala VIP',
                cost_points=3000,
                stock=3,
                category='servico',
            ),
        ]
        for reward in rewards:
            db.add(reward)
        await db.flush()
        print(f'{len(rewards)} recompensas criadas')

        await db.commit()

        print('=' * 50)
        print('SEED COMPLETO')
        print('=' * 50)
        print('Credenciais de acesso (senha padrao: Teste@123):')
        print('ADMIN:     admin@gymforce.app')
        print('PERSONAL:  carlos@gymforce.app')
        print('RECEPCAO:  ana@gymforce.app')
        print('ALUNOS:')
        for aluno in alunos:
            print(
                f'  {aluno.email:30s} | {aluno.tier.value:10s} | '
                f'{aluno.current_points:6d} pts | streak {aluno.streak_count}'
            )
        print('Senha padrao para todos: Teste@123')
        print('API: http://localhost:8000/api/docs')
        print('App: npx expo start (na pasta mobile/)')


if __name__ == '__main__':
    asyncio.run(seed())
