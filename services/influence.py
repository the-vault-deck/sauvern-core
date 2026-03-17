import os
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from models import CreatorProfile

INFLUENCE_ENGINE_URL = os.environ.get("INFLUENCE_ENGINE_URL", "")
CACHE_TTL_SECONDS = 3600

def should_refresh(cached_at: datetime | None) -> bool:
    if cached_at is None:
        return True
    return (datetime.utcnow() - cached_at).total_seconds() > CACHE_TTL_SECONDS

def fetch_and_cache(db: Session, creator: CreatorProfile) -> int:
    """
    Fetches IE score for creator and updates cache.
    On IE unavailable: returns existing cache value (does not zero out).
    Unknown actor (score=0): stores 0 — zero is valid.
    Returns raw integer (fixed-point SF=10,000).
    """
    if not should_refresh(creator.score_cached_at):
        return creator.influence_score_cache

    try:
        resp = httpx.get(
            f"{INFLUENCE_ENGINE_URL}/creators/{creator.soulbolt_account_id}/score",
            timeout=5.0,
        )
        if resp.status_code == 200:
            raw_score = resp.json().get("influence_score", 0)
            creator.influence_score_cache = int(raw_score)
            creator.score_cached_at = datetime.utcnow()
            db.commit()
            return creator.influence_score_cache
    except httpx.RequestError:
        pass  # IE unreachable — fall through to stale cache

    return creator.influence_score_cache
