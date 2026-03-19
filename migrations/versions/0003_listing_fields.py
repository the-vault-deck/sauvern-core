"""add listing fields and creator external_link

Revision ID: 0003_listing_fields
Revises: 0002_purchases
Create Date: 2026-03-19

"""
from alembic import op
import sqlalchemy as sa

revision = '0003_listing_fields'
down_revision = '0002_purchases'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to listings table
    with op.batch_alter_table("listings") as batch_op:
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("category", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("price_cents", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("image_url", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("contact_method", sa.String(), nullable=True, server_default="EMAIL"))
        batch_op.add_column(sa.Column("contact_value", sa.String(), nullable=True, server_default=""))

    # Migrate body -> description (copy data)
    op.execute("UPDATE listings SET description = body WHERE description IS NULL")

    # Add external_link to creator_profiles if missing
    with op.batch_alter_table("creator_profiles") as batch_op:
        batch_op.add_column(sa.Column("external_link", sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("listings") as batch_op:
        batch_op.drop_column("description")
        batch_op.drop_column("category")
        batch_op.drop_column("price_cents")
        batch_op.drop_column("image_url")
        batch_op.drop_column("contact_method")
        batch_op.drop_column("contact_value")

    with op.batch_alter_table("creator_profiles") as batch_op:
        batch_op.drop_column("external_link")
