from datetime import datetime
from pydantic import BaseModel, field_validator
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

# Listing
class ListingCreate(BaseModel):
    title: str
    description: str
    category: str
    price_cents: int | None = None
    image_url: str | None = None
    contact_method: Literal["EMAIL", "URL"]
    contact_value: str

    @field_validator("contact_method")
    @classmethod
    def validate_contact_method(cls, v: str) -> str:
        if v not in ("EMAIL", "URL"):
            raise ValueError("contact_method must be EMAIL or URL")
        return v

class ListingSubmit(BaseModel):
    """Public submission — creates listing in PENDING state."""
    title: str
    description: str
    category: str
    price_cents: int | None = None
    image_url: str | None = None
    contact_method: Literal["EMAIL", "URL"]
    contact_value: str

    @field_validator("contact_method")
    @classmethod
    def validate_contact_method(cls, v: str) -> str:
        if v not in ("EMAIL", "URL"):
            raise ValueError("contact_method must be EMAIL or URL")
        return v

class ListingOut(BaseModel):
    id: str
    creator_id: str
    title: str
    slug: str
    description: str | None
    category: str | None
    price_cents: int | None
    image_url: str | None
    contact_method: str
    contact_value: str | None
    status: str
    submitted_at: datetime | None
    reviewed_at: datetime | None
    reviewed_by: str | None
    rejection_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

class AdminRejectRequest(BaseModel):
    reason: str | None = None

# Score
class ScoreOut(BaseModel):
    handle: str
    influence_score_display: float
    cached_at: datetime | None
