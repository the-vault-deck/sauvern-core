"""
routers/submissions.py
Public submission endpoint.
Any authenticated SOULBOLT user with a creator profile can submit a listing.
Listing is created in PENDING status — not visible on index until approved.

Listing types (mutually exclusive, enforced by ListingSubmit schema validator):
  - Trial listing:    product_id set, price_cents null
  - Purchase listing: price_cents set, product_id null
  - Contact listing:  neither set, contact_value required
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Listing, CreatorProfile
from schemas import ListingSubmit, ListingOut
from auth import require_sb_token
from services.slug import generate_slug

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=ListingOut, status_code=201)
def submit_listing(
    payload: ListingSubmit,
    db: Session = Depends(get_db),
    account_id: str = Depends(require_sb_token),
):
    creator = db.query(CreatorProfile).filter(
        CreatorProfile.soulbolt_account_id == account_id
    ).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found — create profile first")

    slug = generate_slug(payload.title, creator.id, db)
    now = datetime.utcnow()
    listing = Listing(
        creator_id=creator.id,
        title=payload.title,
        slug=slug,
        description=payload.description,
        category=payload.category,
        price_cents=payload.price_cents,
        product_id=payload.product_id,
        image_url=payload.image_url,
        contact_method=payload.contact_method,
        contact_value=payload.contact_value,
        status="PENDING",
        submitted_at=now,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("/mine", response_model=list[ListingOut])
def get_my_submissions(
    db: Session = Depends(get_db),
    account_id: str = Depends(require_sb_token),
):
    """Returns all submissions by the authenticated creator (all statuses)."""
    creator = db.query(CreatorProfile).filter(
        CreatorProfile.soulbolt_account_id == account_id
    ).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    return (
        db.query(Listing)
        .filter(Listing.creator_id == creator.id)
        .order_by(Listing.submitted_at.desc())
        .all()
    )
