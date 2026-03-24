"""
0005_product_id

Adds product_id (nullable TEXT) to listings.
When set, the listing represents a SOULBOLT tool — CTA is "Begin Trial".
When null, listing is a standard creator product (purchase or contact).

product_id and price_cents are mutually exclusive listing types.
Enforced at the application layer (submissions router).

Idempotent: uses ADD COLUMN IF NOT EXISTS pattern.
"""
from alembic import op
import sqlalchemy as sa

revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        pass
    # PostgreSQL supports ADD COLUMN IF NOT EXISTS
    op.execute("""
        ALTER TABLE listings
        ADD COLUMN IF NOT EXISTS product_id TEXT DEFAULT NULL
    """)


def downgrade() -> None:
    op.drop_column('listings', 'product_id')
