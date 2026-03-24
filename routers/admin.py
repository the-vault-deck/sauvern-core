"""
routers/admin.py
SAUVERN admin endpoints — submission review, feature toggle,
creator profile creation, and listing creation on behalf of any creator.
Gated by SAUVERN_ADMIN_ACCOUNT_ID env var.
"""
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Listing, ListingIndex, CreatorProfile
from schemas import ListingOut, AdminRejectRequest, CreatorOut, AdminCreatorCreate, AdminListingCreate
from auth import require_sb_token
from services.slug import generate_slug

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_ACCOUNT_ID = os.environ.get("SAUVERN_ADMIN_ACCOUNT_ID", "")


def require_admin(account_id: str = Depends(require_sb_token)) -> str:
    if not ADMIN_ACCOUNT_ID:
        raise HTTPException(status_code=503, detail="Admin not configured")
    if account_id != ADMIN_ACCOUNT_ID:
        raise HTTPException(status_code=403, detail="Forbidden")
    return account_id


@router.get("/me")
def get_admin_status(account_id: str = Depends(require_sb_token)):
    return {"is_admin": bool(ADMIN_ACCOUNT_ID) and account_id == ADMIN_ACCOUNT_ID}


@router.post("/creators", response_model=CreatorOut, status_code=201)
def admin_create_creator(
    payload: AdminCreatorCreate,
    db: Session = Depends(get_db),
    admin_id: str = Depends(require_admin),
):
    if db.query(CreatorProfile).filter(
        CreatorProfile.soulbolt_account_id == payload.soulbolt_account_id
    ).first():
        raise HTTPException(status_code=409, detail="Creator profile already exists for this account")
    if db.query(CreatorProfile).filter(CreatorProfile.handle == payload.handle).first():
        raise HTTPException(status_code=409, detail="Handle already taken")

    creator = CreatorProfile(
        soulbolt_account_id=payload.soulbolt_account_id,
        handle=payload.handle,
        display_name=payload.display_name,
        bio=payload.bio,
        avatar_url=str(payload.avatar_url) if payload.avatar_url else None,
        external_link=str(payload.external_link) if payload.external_link else None,
    )
    db.add(creator)
    db.commit()
    db.refresh(creator)
    return CreatorOut(
        id=creator.id,
        soulbolt_account_id=creator.soulbolt_account_id,
        handle=creator.handle,
        display_name=creator.display_name,
        bio=creator.bio,
        avatar_url=creator.avatar_url,
        external_link=creator.external_link,
        influence_score_display=creator.influence_score_cache / 10000,
        created_at=creator.created_at,
    )


@router.post("/listings", response_model=ListingOut, status_code=201)
def admin_create_listing(
    payload: AdminListingCreate,
    db: Session = Depends(get_db),
    admin_id: str = Depends(require_admin),
):
    """Create a listing on behalf of any creator by creator_id.
    Listing + ListingIndex written in a single transaction. Rolls back on failure.
    """
    creator = db.query(CreatorProfile).filter(CreatorProfile.id == payload.creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    slug = generate_slug(payload.title, creator.id, db)
    listing = Listing(
        creator_id=creator.id,
        title=payload.title,
        slug=slug,
        description=payload.description,
        category=payload.category,
        price_cents=payload.price_cents,
        product_id=payload.product_id,
        image_url=str(payload.image_url) if payload.image_url else None,
        contact_method=payload.contact_method,
        contact_value=payload.contact_value,
        is_featured=payload.is_featured,
        status="ACTIVE",
    )
    try:
        db.add(listing)
        db.flush()
        index_entry = ListingIndex(
            listing_id=listing.id,
            creator_id=creator.id,
            published_at=listing.created_at,
        )
        db.add(index_entry)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Listing creation failed")
    db.refresh(listing)
    return listing


@router.get("/submissions", response_model=list[ListingOut])
def get_pending_submissions(
    status: str = "PENDING",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin_id: str = Depends(require_admin),
):
    return (
        db.query(Listing)
        .filter(Listing.status == status.upper())
        .order_by(Listing.submitted_at.asc())
        .offset(skip).limit(limit)
        .all()
    )


@router.post("/submissions/{listing_id}/approve", response_model=ListingOut)
def approve_submission(
    listing_id: str,
    db: Session = Depends(get_db),
    admin_id: str = Depends(require_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status not in ("PENDING", "REJECTED"):
        raise HTTPException(status_code=409, detail=f"Cannot approve listing with status {listing.status}")

    now = datetime.utcnow()
    listing.status = "APPROVED"
    listing.reviewed_at = now
    listing.reviewed_by = admin_id
    listing.rejection_reason = None
    db.commit()

    existing = db.query(ListingIndex).filter(ListingIndex.listing_id == listing_id).first()
    if not existing:
        index_entry = ListingIndex(
            listing_id=listing.id,
            creator_id=listing.creator_id,
            published_at=now,
        )
        db.add(index_entry)
        db.commit()

    db.refresh(listing)
    return listing


@router.post("/submissions/{listing_id}/reject", response_model=ListingOut)
def reject_submission(
    listing_id: str,
    body: AdminRejectRequest,
    db: Session = Depends(get_db),
    admin_id: str = Depends(require_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status not in ("PENDING",):
        raise HTTPException(status_code=409, detail=f"Cannot reject listing with status {listing.status}")

    listing.status = "REJECTED"
    listing.reviewed_at = datetime.utcnow()
    listing.reviewed_by = admin_id
    listing.rejection_reason = body.reason

    index_entry = db.query(ListingIndex).filter(ListingIndex.listing_id == listing_id).first()
    if index_entry:
        db.delete(index_entry)

    db.commit()
    db.refresh(listing)
    return listing
