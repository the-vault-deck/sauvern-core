import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, ForeignKey, UniqueConstraint, DateTime
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

    listings: Mapped[list["Listing"]] = relationship("Listing", back_populates="creator")

class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("creator_profiles.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    price_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_method: Mapped[str] = mapped_column(String, default="EMAIL", nullable=False)
    contact_value: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="ACTIVE", nullable=False)  # ACTIVE | ARCHIVED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    creator: Mapped["CreatorProfile"] = relationship("CreatorProfile", back_populates="listings")
    index_entry: Mapped["ListingIndex | None"] = relationship("ListingIndex", back_populates="listing", uselist=False)

    __table_args__ = (UniqueConstraint("creator_id", "slug", name="uq_creator_slug"),)

class ListingIndex(Base):
    __tablename__ = "listing_index"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    listing_id: Mapped[str] = mapped_column(String, ForeignKey("listings.id"), nullable=False)
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("creator_profiles.id"), nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    listing: Mapped["Listing"] = relationship("Listing", back_populates="index_entry")


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    listing_id: Mapped[str] = mapped_column(String, ForeignKey("listings.id"), nullable=False)
    buyer_account_id: Mapped[str] = mapped_column(String, nullable=False)
    stripe_session_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String, default="completed", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
