"""add_assessments_challenges_referrals

Revision ID: f1a2b3c4d5e6
Revises: e4f9b7c6a1d0
Create Date: 2026-04-12 14:30:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: str | None = 'e4f9b7c6a1d0'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'assessments',
        sa.Column('user_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('assessed_by', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('assessment_date', sa.Date(), nullable=False),
        sa.Column('weight_kg', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('height_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('body_fat_pct', sa.Numeric(precision=4, scale=1), nullable=True),
        sa.Column('muscle_mass_kg', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('chest_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('waist_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('hips_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('right_arm_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('left_arm_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('right_thigh_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('left_thigh_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('right_calf_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('left_calf_cm', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['assessed_by'], ['users.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_assessments_user_id'), 'assessments', ['user_id'], unique=False)

    op.create_table(
        'challenges',
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'goal_type',
            sa.Enum('CHECKINS', 'WORKOUTS', 'POINTS', 'STREAK', name='challengegoaltype'),
            nullable=False,
        ),
        sa.Column('goal_value', sa.Integer(), nullable=False),
        sa.Column('reward_points', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('icon', sa.String(length=10), nullable=False),
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'referrals',
        sa.Column('referrer_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('referral_code', sa.String(length=20), nullable=False),
        sa.Column('referred_email', sa.String(length=255), nullable=True),
        sa.Column('referred_user_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column(
            'status',
            sa.Enum('PENDING', 'REGISTERED', 'ACTIVATED', name='referralstatus'),
            nullable=False,
        ),
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['referred_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['referrer_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_referrals_referral_code'), 'referrals', ['referral_code'], unique=True)
    op.create_index(op.f('ix_referrals_referrer_id'), 'referrals', ['referrer_id'], unique=False)

    op.create_table(
        'user_challenges',
        sa.Column('user_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('challenge_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('progress', sa.Integer(), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False),
        sa.Column('completed_at', sa.Date(), nullable=True),
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['challenge_id'], ['challenges.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_user_challenges_challenge_id'),
        'user_challenges',
        ['challenge_id'],
        unique=False,
    )
    op.create_index(op.f('ix_user_challenges_user_id'), 'user_challenges', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_challenges_user_id'), table_name='user_challenges')
    op.drop_index(op.f('ix_user_challenges_challenge_id'), table_name='user_challenges')
    op.drop_table('user_challenges')

    op.drop_index(op.f('ix_referrals_referrer_id'), table_name='referrals')
    op.drop_index(op.f('ix_referrals_referral_code'), table_name='referrals')
    op.drop_table('referrals')

    op.drop_table('challenges')

    op.drop_index(op.f('ix_assessments_user_id'), table_name='assessments')
    op.drop_table('assessments')
