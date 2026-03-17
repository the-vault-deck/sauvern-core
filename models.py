import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, ForeignKey, UniqueConstraint, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

def new_uuid() -> str:
    return str(uuid.uuid4())

class CreatorProfile(Base):
    __tablename__ = "creator_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    soulbolt_account_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    handle: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    external_link: Mapped[str | None] = mapped_column(String, nullable=True)
    influence_score_cache: Mapped[int] = mapped_column(Integer, default=0)
    score_cached_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_creator_profiles_handle", "handle"),
        Index("ix_creator_profiles_soulbolt_account_id", "soulbolt_account_id"),
    )

    listings: Mapped[list["Listing"]] = relationship("Listing", back_populates="creator")


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("creator_profiles.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    price_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)   # null = price on request
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_method: Mapped[str] = mapped_column(String, nullable=False)       # EMAIL | URL
    contact_value: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="ACTIVE", nullable=False)  # ACTIVE | ARCHIVED | REMOVED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    creator: Mapped["CreatorProfile"] = relationship("CreatorProfile", back_populates="listings")
    index_entry: Mapped["ListingIndex | None"] = relationship("ListingIndex", back_populates="listing", uselist=False)

    __table_args__ = (
        UniqueConstraint("creator_id", "slug", name="uq_creator_slug"),
        Index("ix_listings_creator_id", "creator_id"),
        Index("ix_listings_status", "status"),
    )

    # TODO: listing_events table for audit trail (post-v0.1)


class ListingIndex(Base):
    __tablename__ = "listing_index"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    listing_id: Mapped[str] = mapped_column(String, ForeignKey("listings.id"), nullable=False)
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("creator_profiles.id"), nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    listing: Mapped["Listing"] = relationship("Listing", back_populates="index_entry")

    __table_args__ = (
        Index("ix_listing_index_published_at", "published_at"),
        Index("ix_listing_index_creator_id", "creator_id"),
    )
