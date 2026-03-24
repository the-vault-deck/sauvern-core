"""add is_featured to listings

Revision ID: 0006_is_featured
Revises: 0005
Create Date: 2026-03-24
"""
from alembic import op
import sqlalchemy as sa

revision = '0006_is_featured'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE listings
        ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_listings_featured_true
        ON listings (is_featured)
        WHERE is_featured = TRUE
    """)


def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_listings_featured_true")
    op.execute("ALTER TABLE listings DROP COLUMN IF EXISTS is_featured")
