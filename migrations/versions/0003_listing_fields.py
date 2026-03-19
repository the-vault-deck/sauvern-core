"""add listing fields and creator external_link

Revision ID: 0003_listing_fields
Revises: 0002_purchases
Create Date: 2026-03-19

Idempotent — uses IF NOT EXISTS raw SQL so re-running against a DB
where these columns already exist is safe. Fixes DuplicateColumn crash.
"""
from alembic import op

revision = '0003_listing_fields'
down_revision = '0002_purchases'
branch_labels = None
depends_on = None


def upgrade():
    # Listings — all idempotent
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS description TEXT")
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS category VARCHAR")
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_cents INTEGER")
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url VARCHAR")
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS contact_method VARCHAR DEFAULT 'EMAIL'")
    op.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS contact_value VARCHAR")

    # Migrate body -> description for any rows that predate this column
    op.execute("UPDATE listings SET description = body WHERE description IS NULL AND body IS NOT NULL")

    # Creator profiles
    op.execute("ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS external_link VARCHAR")


def downgrade():
    # Non-destructive — columns remain, no data loss
    pass
