from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Listing, ListingIndex, CreatorProfile
from schemas import ListingCreate, ListingOut
from auth import require_sb_token
from services.slug import generate_slug
from services.influence import fetch_and_cache

router = APIRouter(prefix="/listings", tags=["listings"])

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
        status="ACTIVE",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Insert into listing_index
    index_entry = ListingIndex(
        listing_id=listing.id,
        creator_id=creator.id,
        published_at=listing.created_at,
    )
    db.add(index_entry)
    db.commit()

    # Refresh IE score cache on listing creation
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

@router.get("/mine/drafts", response_model=list[ListingOut])
def get_my_listings(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    account_id: str = Depends(require_sb_token),
):
    creator = db.query(CreatorProfile).filter(
        CreatorProfile.soulbolt_account_id == account_id
    ).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")

    listings = (
        db.query(Listing)
        .filter(Listing.creator_id == creator.id)
        .order_by(Listing.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    return listings
