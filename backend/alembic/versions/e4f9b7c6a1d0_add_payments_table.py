"""add_payments_table

Revision ID: e4f9b7c6a1d0
Revises: a3d02f9c8b12
Create Date: 2026-04-12 12:30:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4f9b7c6a1d0'
down_revision: str | None = 'a3d02f9c8b12'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'payments',
        sa.Column('user_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('plan_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('membership_id', sa.UUID(as_uuid=False), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('discount_points', sa.Integer(), nullable=False),
        sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('final_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            'method',
            sa.Enum('PIX', 'CREDIT_CARD', 'POINTS_DISCOUNT', name='paymentmethod'),
            nullable=False,
        ),
        sa.Column(
            'status',
            sa.Enum(
                'PENDING',
                'APPROVED',
                'REJECTED',
                'CANCELLED',
                'REFUNDED',
                'EXPIRED',
                name='paymentstatus',
            ),
            nullable=False,
        ),
        sa.Column('mp_payment_id', sa.String(length=50), nullable=True),
        sa.Column('mp_qr_code', sa.Text(), nullable=True),
        sa.Column('mp_qr_code_base64', sa.Text(), nullable=True),
        sa.Column('mp_ticket_url', sa.String(length=500), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(['membership_id'], ['memberships.id']),
        sa.ForeignKeyConstraint(['plan_id'], ['plans.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_payments_mp_payment_id'), 'payments', ['mp_payment_id'], unique=False)
    op.create_index(op.f('ix_payments_user_id'), 'payments', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_payments_user_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_mp_payment_id'), table_name='payments')
    op.drop_table('payments')
