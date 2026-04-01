"""feature Strikecoin listing

Revision ID: 0008_feature_strikecoin
Revises: 0007_strikecoin_listing
Create Date: 2026-04-01
"""
from alembic import op
import sqlalchemy as sa

revision = "0008_feature_strikecoin"
down_revision = "0007_strikecoin_listing"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE listings
            SET is_featured = TRUE
            WHERE product_id = :product_id
            """
        ),
        {"product_id": "strikecoin"},
    )


def downgrade() -> None:
    raise NotImplementedError(
        "0008 downgrade is blocked. Featured listing state for strikecoin must be preserved."
    )
