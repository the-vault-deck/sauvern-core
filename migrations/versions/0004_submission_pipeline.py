"""add submission pipeline fields to listings

Revision ID: 0004_submission_pipeline
Revises: 0003_listing_fields
Create Date: 2026-03-23

Idempotent — all ADD COLUMN IF NOT EXISTS.
"""
from alembic import op

revision = '0004_submission_pipeline'
down_revision = '0003_listing_fields'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP")
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP")
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR")
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_reason TEXT")
    # Existing ACTIVE records remain valid — status column already exists


def downgrade():
    pass
