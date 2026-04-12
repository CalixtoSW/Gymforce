"""add_badges_user_badges_push_tokens

Revision ID: a3d02f9c8b12
Revises: 7f3b92f66cc2
Create Date: 2026-04-12 11:20:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3d02f9c8b12'
down_revision: str | None = '7f3b92f66cc2'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'badges',
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('icon', sa.String(length=10), nullable=False),
        sa.Column('points_bonus', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('category', sa.String(length=30), nullable=False),
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
    op.create_index(op.f('ix_badges_code'), 'badges', ['code'], unique=True)

    op.create_table(
        'push_tokens',
        sa.Column('user_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('device_type', sa.String(length=10), nullable=False),
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
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'token', name='uq_user_push_token'),
    )
    op.create_index(op.f('ix_push_tokens_user_id'), 'push_tokens', ['user_id'], unique=False)

    op.create_table(
        'user_badges',
        sa.Column('user_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('badge_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column(
            'earned_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.ForeignKeyConstraint(['badge_id'], ['badges.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'badge_id', name='uq_user_badge'),
    )
    op.create_index(op.f('ix_user_badges_user_id'), 'user_badges', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_badges_user_id'), table_name='user_badges')
    op.drop_table('user_badges')
    op.drop_index(op.f('ix_push_tokens_user_id'), table_name='push_tokens')
    op.drop_table('push_tokens')
    op.drop_index(op.f('ix_badges_code'), table_name='badges')
    op.drop_table('badges')
