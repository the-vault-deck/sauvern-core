"""create purchases table

Revision ID: 0002_purchases
Revises: 
Create Date: 2026-03-17

"""
from alembic import op
import sqlalchemy as sa

revision = '0002_purchases'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'purchases',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('listing_id', sa.String(),
                  sa.ForeignKey('listings.id'), nullable=False),
        sa.Column('buyer_account_id', sa.String(), nullable=False),
        sa.Column('stripe_session_id', sa.String(), unique=True, nullable=False),
        sa.Column('status', sa.String(), server_default='completed'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('purchases')
