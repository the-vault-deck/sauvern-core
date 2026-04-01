"""seed Strikecoin listing metadata

Revision ID: 0007_strikecoin_listing
Revises: 0006
Create Date: 2026-04-01

Append-only migration:
- adds optional metadata columns for platform-managed product listings
- seeds a Strikecoin listing owned by the mAIn St. Solutions platform creator
"""
from alembic import op
import sqlalchemy as sa

revision = "0007_strikecoin_listing"
down_revision = "0006_is_featured"
branch_labels = None
depends_on = None


PLATFORM_CREATOR_ID = "a08b48e3-c8dd-4f60-b0c4-8b646ce6518d"
STRIKECOIN_LISTING_ID = "ee55c91d-a3f6-4fde-b653-b2a76f6f02f6"
STRIKECOIN_INDEX_ID = "d44e7ce2-bb3c-4dda-b19d-efca95d55ab6"
PLATFORM_ACCOUNT_ID = "system-main-st-solutions"
PLATFORM_HANDLE = "main-st-solutions"
PLATFORM_NAME = "mAIn St. Solutions"
STRIKECOIN_TAGLINE = "Structured decision tracking for income-testing journeys."
STRIKECOIN_ACQUIRE_URL = "https://soulbolt.ai/api/start?product_id=strikecoin"
STRIKECOIN_LAUNCH_URL = "VITE_STRIKECOIN_URL"


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE listings
        ADD COLUMN IF NOT EXISTS tier_required TEXT
        """
    )
    op.execute(
        """
        ALTER TABLE listings
        ADD COLUMN IF NOT EXISTS acquire_url TEXT
        """
    )
    op.execute(
        """
        ALTER TABLE listings
        ADD COLUMN IF NOT EXISTS launch_url TEXT
        """
    )

    bind = op.get_bind()

    bind.execute(
        sa.text(
            """
            INSERT INTO creator_profiles (
                id,
                soulbolt_account_id,
                handle,
                display_name,
                bio,
                external_link,
                influence_score_cache,
                created_at
            )
            SELECT
                :id,
                :account_id,
                :handle,
                :display_name,
                :bio,
                :external_link,
                0,
                NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM creator_profiles WHERE handle = :handle
            )
            """
        ),
        {
            "id": PLATFORM_CREATOR_ID,
            "account_id": PLATFORM_ACCOUNT_ID,
            "handle": PLATFORM_HANDLE,
            "display_name": PLATFORM_NAME,
            "bio": "Platform-managed listings for mAIn St. Solutions products.",
            "external_link": "https://soulbolt.ai",
        },
    )

    creator_id = bind.execute(
        sa.text("SELECT id FROM creator_profiles WHERE handle = :handle"),
        {"handle": PLATFORM_HANDLE},
    ).scalar()

    bind.execute(
        sa.text(
            """
            INSERT INTO listings (
                id,
                creator_id,
                title,
                slug,
                description,
                category,
                price_cents,
                image_url,
                contact_method,
                contact_value,
                product_id,
                is_featured,
                status,
                created_at,
                tier_required,
                acquire_url,
                launch_url
            )
            SELECT
                :id,
                :creator_id,
                :title,
                :slug,
                :description,
                :category,
                NULL,
                NULL,
                'URL',
                NULL,
                :product_id,
                FALSE,
                'ACTIVE',
                NOW(),
                :tier_required,
                :acquire_url,
                :launch_url
            WHERE NOT EXISTS (
                SELECT 1 FROM listings WHERE product_id = :product_id
            )
            """
        ),
        {
            "id": STRIKECOIN_LISTING_ID,
            "creator_id": creator_id,
            "title": "Strikecoin",
            "slug": "strikecoin",
            "description": STRIKECOIN_TAGLINE,
            "category": "Tool",
            "product_id": "strikecoin",
            "tier_required": "claim",
            "acquire_url": STRIKECOIN_ACQUIRE_URL,
            "launch_url": STRIKECOIN_LAUNCH_URL,
        },
    )

    bind.execute(
        sa.text(
            """
            UPDATE listings
            SET
                title = :title,
                slug = :slug,
                description = :description,
                category = :category,
                price_cents = NULL,
                contact_method = 'URL',
                contact_value = NULL,
                product_id = :product_id,
                is_featured = FALSE,
                status = 'ACTIVE',
                tier_required = :tier_required,
                acquire_url = :acquire_url,
                launch_url = :launch_url
            WHERE product_id = :product_id
            """
        ),
        {
            "title": "Strikecoin",
            "slug": "strikecoin",
            "description": STRIKECOIN_TAGLINE,
            "category": "Tool",
            "product_id": "strikecoin",
            "tier_required": "claim",
            "acquire_url": STRIKECOIN_ACQUIRE_URL,
            "launch_url": STRIKECOIN_LAUNCH_URL,
        },
    )

    bind.execute(
        sa.text(
            """
            INSERT INTO listing_index (id, listing_id, creator_id, published_at)
            SELECT
                :index_id,
                l.id,
                l.creator_id,
                COALESCE(l.created_at, NOW())
            FROM listings l
            WHERE l.product_id = :product_id
              AND NOT EXISTS (
                SELECT 1 FROM listing_index li WHERE li.listing_id = l.id
              )
            """
        ),
        {
            "index_id": STRIKECOIN_INDEX_ID,
            "product_id": "strikecoin",
        },
    )


def downgrade() -> None:
    raise NotImplementedError(
        "0007 downgrade is blocked. Append-only platform metadata and seeded listing rows must be preserved."
    )
