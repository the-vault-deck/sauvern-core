import base64
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Listing, ListingIndex, CreatorProfile
from schemas import ListingCreate, ListingOut, FeaturedListingOut, FeaturedPage, FeatureToggleRequest
from auth import require_sb_token
from services.slug import generate_slug
from services.influence import fetch_and_cache
import os

router = APIRouter(prefix="/listings", tags=["listings"])

ADMIN_ACCOUNT_ID = os.environ.get("SAUVERN_ADMIN_ACCOUNT_ID", "")


def _require_admin(account_id: str = Depends(require_sb_token)) -> str:
    if not ADMIN_ACCOUNT_ID:
        raise HTTPException(status_code=503, detail="Admin not configured")
    if account_id != ADMIN_ACCOUNT_ID:
        raise HTTPException(status_code=403, detail="Forbidden")
    return account_id


def _listing_type(listing: Listing) -> str:
    if listing.product_id:
        return "trial"
    if listing.price_cents is not None:
        return "purchase"
    return "contact"


def _to_featured_out(listing: Listing) -> FeaturedListingOut:
    creator = listing.creator
    external_link = listing.contact_value or None
    return FeaturedListingOut(
        id=listing.id,
        slug=listing.slug,
        title=listing.title,
        description=listing.description,
        price_cents=listing.price_cents,
        external_link=external_link,
        listing_type=_listing_type(listing),
        creator=creator,
    )


# ── Public: featured listings for home page ──────────────────────────────────
@router.get("/featured", response_model=FeaturedPage)
def get_featured_listings(
    limit: int = Query(default=12, ge=1, le=24),
    cursor: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Listing)
        .options(joinedload(Listing.creator))
        .join(Listing.creator)  # inner join — excludes listings with no creator
        .filter(Listing.is_featured == True)  # noqa: E712
    )

    if cursor:
        try:
            decoded = base64.b64decode(cursor.encode()).decode()
            ts_str, lid = decoded.split("|", 1)
            cursor_ts = datetime.fromisoformat(ts_str)
            query = query.filter(
                (Listing.created_at < cursor_ts)
                | ((Listing.created_at == cursor_ts) & (Listing.id < lid))
            )
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid cursor")

    rows = (
        query
        .order_by(Listing.created_at.desc(), Listing.id.desc())
        .limit(limit + 1)
        .all()
    )

    has_more = len(rows) > limit
    items = rows[:limit]

    next_cursor = None
    if has_more:
        last = items[-1]
        raw = f"{last.created_at.isoformat()}|{last.id}"
        next_cursor = base64.b64encode(raw.encode()).decode()

    valid = []
    for l in items:
        lt = _listing_type(l)
        if lt == "contact" and not l.contact_value:
            continue
        if lt == "purchase" and l.price_cents is None:
            continue
        valid.append(_to_featured_out(l))

    return FeaturedPage(items=valid, next_cursor=next_cursor)


# ── Admin: toggle is_featured ─────────────────────────────────────────────────
@router.patch("/{listing_id}/feature", response_model=ListingOut)
def toggle_feature(
    listing_id: str,
    body: FeatureToggleRequest,
    db: Session = Depends(get_db),
    admin_id: str = Depends(_require_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing.is_featured = body.is_featured
    db.commit()
    db.refresh(listing)
    return listing


# ── Auth: my listings ─────────────────────────────────────────────────────────
@router.get("/mine", response_model=list[ListingOut])
def get_my_listings(
    db: Session = Depends(get_db),
    account_id: str = Depends(require_sb_token),
):
    creator = db.query(CreatorProfile).filter(
        CreatorProfile.soulbolt_account_id == account_id
    ).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    return (
        db.query(Listing)
        .filter(Listing.creator_id == creator.id)
        .order_by(Listing.created_at.desc())
        .all()
    )


# ── Public: listings by creator_id ────────────────────────────────────────────
@router.get("/{creator_id}", response_model=list[ListingOut])
def get_listings_for_creator(
    creator_id: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    listings = (
        db.query(Listing)
        .filter(Listing.creator_id == creator_id, Listing.status == "ACTIVE")
        .order_by(Listing.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    return listings


@router.get("/{creator_id}/{slug}", response_model=ListingOut)
def get_listing(creator_id: str, slug: str, db: Session = Depends(get_db)):
    listing = (
        db.query(Listing)
        .filter(Listing.creator_id == creator_id, Listing.slug == slug)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.post("", response_model=ListingOut, status_code=201)
def create_listing(
    payload: ListingCreate,
    db: Session = Depends(get_db),
    account_id: str = Depends(require_sb_token),
):
    creator = db.query(CreatorProfile).filter(
        CreatorProfile.soulbolt_account_id == account_id
    ).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found — create profile first")

    is_featured = False
    if payload.is_featured and account_id == ADMIN_ACCOUNT_ID:
        is_featured = True

    slug = generate_slug(payload.title, creator.id, db)
    listing = Listing(
        creator_id=creator.id,
        title=payload.title,
        slug=slug,
        description=payload.description,
        category=payload.category,
        price_cents=payload.price_cents,
        image_url=payload.image_url,
        contact_method=payload.contact_method,
        contact_value=payload.contact_value,
        is_featured=is_featured,
        status="ACTIVE",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    index_entry = ListingIndex(
        listing_id=listing.id,
        creator_id=creator.id,
        published_at=listing.created_at,
    )
    db.add(index_entry)
    db.commit()

    fetch_and_cache(db, creator)

    return listing


@router.patch("/{creator_id}/{slug}/archive", response_model=ListingOut)
def archive_listing(
    creator_id: str,
    slug: str,
    db: Session = Depends(get_db),
    account_id: str = Depends(require_sb_token),
):
    creator = db.query(CreatorProfile).filter(
        CreatorProfile.soulbolt_account_id == account_id
    ).first()
    if not creator or creator.id != creator_id:
        raise HTTPException(status_code=403, detail="Not your listing")

    listing = db.query(Listing).filter(
        Listing.creator_id == creator_id,
        Listing.slug == slug,
    ).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status == "ARCHIVED":
        raise HTTPException(status_code=409, detail="Already archived")

    listing.status = "ARCHIVED"
    db.commit()
    db.refresh(listing)
    return listing
