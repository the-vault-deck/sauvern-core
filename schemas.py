from datetime import datetime
from pydantic import BaseModel, AnyUrl, field_validator, model_validator
from typing import Literal

# Creator
class CreatorCreate(BaseModel):
    handle: str
    display_name: str
    bio: str | None = None
    avatar_url: str | None = None
    external_link: str | None = None

class CreatorUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    external_link: str | None = None

class CreatorOut(BaseModel):
    id: str
    soulbolt_account_id: str
    handle: str
    display_name: str
    bio: str | None
    avatar_url: str | None
    external_link: str | None
    influence_score_display: float
    created_at: datetime

    model_config = {"from_attributes": True}

# Admin: create creator profile on behalf of any soulbolt account
class AdminCreatorCreate(BaseModel):
    soulbolt_account_id: str
    handle: str
    display_name: str
    bio: str | None = None
    avatar_url: AnyUrl | None = None
    external_link: AnyUrl | None = None

# Minimal creator shape embedded in featured listing responses
class CreatorSnippet(BaseModel):
    handle: str
    display_name: str
    avatar_url: str | None

    model_config = {"from_attributes": True}

# Listing
class ListingCreate(BaseModel):
    title: str
    description: str
    category: str
    price_cents: int | None = None
    image_url: str | None = None
    contact_method: Literal["EMAIL", "URL"]
    contact_value: str
    is_featured: bool = False

    @field_validator("contact_method")
    @classmethod
    def validate_contact_method(cls, v: str) -> str:
        if v not in ("EMAIL", "URL"):
            raise ValueError("contact_method must be EMAIL or URL")
        return v

class ListingSubmit(BaseModel):
    """Public submission — creates listing in PENDING state.

    Listing types (mutually exclusive):
      - Trial listing:    product_id set, price_cents null, contact_value null
      - Purchase listing: price_cents set, product_id null
      - Contact listing:  neither set, contact_value required
    """
    title: str
    description: str
    category: str
    price_cents: int | None = None
    product_id: str | None = None
    image_url: str | None = None
    contact_method: Literal["EMAIL", "URL"] = "URL"
    contact_value: str | None = None

    @model_validator(mode="after")
    def validate_listing_type(self) -> "ListingSubmit":
        has_price = self.price_cents is not None
        has_product = self.product_id is not None
        has_contact = self.contact_value is not None

        if has_price and has_product:
            raise ValueError("price_cents and product_id are mutually exclusive")
        if not has_product and not has_price and not has_contact:
            raise ValueError("contact_value is required for contact listings")
        return self

class ListingOut(BaseModel):
    id: str
    creator_id: str
    title: str
    slug: str
    description: str | None
    category: str | None
    price_cents: int | None
    product_id: str | None
    image_url: str | None
    contact_method: str
    contact_value: str | None
    is_featured: bool
    status: str
    submitted_at: datetime | None
    reviewed_at: datetime | None
    reviewed_by: str | None
    rejection_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

class FeaturedListingOut(BaseModel):
    id: str
    title: str
    description: str | None
    price_cents: int | None
    external_link: str | None
    listing_type: str  # trial | purchase | contact
    creator: CreatorSnippet

    model_config = {"from_attributes": True}

class FeatureToggleRequest(BaseModel):
    is_featured: bool

class AdminRejectRequest(BaseModel):
    reason: str | None = None

# Score
class ScoreOut(BaseModel):
    handle: str
    influence_score_display: float
    cached_at: datetime | None

class FeaturedPage(BaseModel):
    items: list[FeaturedListingOut]
    next_cursor: str | None
