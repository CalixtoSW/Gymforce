"""add_workout_sessions_and_set_logs

Revision ID: b91c2f4d8eab
Revises: f1a2b3c4d5e6
Create Date: 2026-04-12 23:10:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b91c2f4d8eab'
down_revision: str | None = 'f1a2b3c4d5e6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'workout_sessions',
        sa.Column('user_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('sheet_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column(
            'status',
            sa.Enum('ACTIVE', 'PAUSED', 'COMPLETED', 'PARTIAL', 'CANCELLED', name='sessionstatus'),
            nullable=False,
        ),
        sa.Column(
            'started_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('paused_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_pause_seconds', sa.Integer(), nullable=False),
        sa.Column('active_duration_seconds', sa.Integer(), nullable=True),
        sa.Column('total_sets_planned', sa.Integer(), nullable=False),
        sa.Column('total_sets_completed', sa.Integer(), nullable=False),
        sa.Column('total_sets_skipped', sa.Integer(), nullable=False),
        sa.Column('completion_pct', sa.Integer(), nullable=False),
        sa.Column(
            'partial_reason',
            sa.Enum(
                'INJURY',
                'FATIGUE',
                'TIME_CONSTRAINT',
                'EQUIPMENT_BUSY',
                'FEELING_UNWELL',
                'PERSONAL_DECISION',
                'OTHER',
                name='partialreason',
            ),
            nullable=True,
        ),
        sa.Column('partial_notes', sa.String(length=500), nullable=True),
        sa.Column('finished_by', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('points_earned', sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(['finished_by'], ['users.id']),
        sa.ForeignKeyConstraint(['sheet_id'], ['workout_sheets.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_workout_sessions_user_id'),
        'workout_sessions',
        ['user_id'],
        unique=False,
    )

    op.create_table(
        'set_logs',
        sa.Column('session_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('exercise_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('set_number', sa.Integer(), nullable=False),
        sa.Column('planned_reps', sa.String(length=20), nullable=False),
        sa.Column('planned_weight_kg', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('actual_reps', sa.Integer(), nullable=True),
        sa.Column('actual_weight_kg', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column(
            'status',
            sa.Enum('COMPLETED', 'SKIPPED', 'PARTIAL', 'FAILED', name='setlogstatus'),
            nullable=False,
        ),
        sa.Column('rest_seconds_taken', sa.Integer(), nullable=True),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id']),
        sa.ForeignKeyConstraint(['session_id'], ['workout_sessions.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_set_logs_session_id'), 'set_logs', ['session_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_set_logs_session_id'), table_name='set_logs')
    op.drop_table('set_logs')

    op.drop_index(op.f('ix_workout_sessions_user_id'), table_name='workout_sessions')
    op.drop_table('workout_sessions')
