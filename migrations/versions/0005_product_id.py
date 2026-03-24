"""
0005_product_id

Adds product_id (nullable TEXT) to listings.
When set, the listing represents a SOULBOLT tool — CTA is "Begin Trial".
When null, listing is a standard creator product (purchase or contact).

product_id and price_cents are mutually exclusive listing types.
Enforced at the application layer (submissions router).

Idempotent: uses ADD COLUMN IF NOT EXISTS pattern.

Downgrade: no-op. Append-only platform — columns are never dropped.
Data written to product_id must not be destroyed on rollback.
"""
from alembic import op
import sqlalchemy as sa

revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL supports ADD COLUMN IF NOT EXISTS
    op.execute("""
        ALTER TABLE listings
        ADD COLUMN IF NOT EXISTS product_id TEXT DEFAULT NULL
    """)


def downgrade() -> None:
    # Append-only platform. Columns are never dropped.
    # product_id data must be preserved. Downgrade is intentionally a no-op.
    raise NotImplementedError(
        "0005 downgrade is blocked. Append-only platform — product_id column cannot be dropped. "
        "Restore from backup if rollback is required."
    )
