from datetime import datetime
from pydantic import BaseModel

# Creator
class CreatorCreate(BaseModel):
    handle: str
    display_name: str
    bio: str | None = None
    avatar_url: str | None = None

class CreatorUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None

class CreatorOut(BaseModel):
    id: str
    soulbolt_account_id: str
    handle: str
    display_name: str
    bio: str | None
    avatar_url: str | None
    influence_score_display: float  # influence_score_cache / 10000
    created_at: datetime

    model_config = {"from_attributes": True}

# Listing
class ListingCreate(BaseModel):
    title: str
    body: str

class ListingOut(BaseModel):
    id: str
    creator_id: str
    title: str
    slug: str
    body: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

# Score
class ScoreOut(BaseModel):
    handle: str
    influence_score_display: float  # raw / 10000
    cached_at: datetime | None
