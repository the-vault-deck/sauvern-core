"""
routers/admin.py
SAUVERN admin endpoints — submission review queue, feature toggle,
and creator profile creation on behalf of any soulbolt account.
Gated by SAUVERN_ADMIN_ACCOUNT_ID env var.
Only the account matching that ID can access these routes.
"""
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Listing, ListingIndex, CreatorProfile
from schemas import ListingOut, AdminRejectRequest, CreatorOut, AdminCreatorCreate
from auth import require_sb_token

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_ACCOUNT_ID = os.environ.get("SAUVERN_ADMIN_ACCOUNT_ID", "")


def require_admin(account_id: str = Depends(require_sb_token)) -> str:
    """Dependency: validates sb_token via require_sb_token, then checks admin ID.
    Raises 503 if admin not configured, 403 if account is not admin.
    """
    if not ADMIN_ACCOUNT_ID:
        raise HTTPException(status_code=503, detail="Admin not configured")
    if account_id != ADMIN_ACCOUNT_ID:
        raise HTTPException(status_code=403, detail="Forbidden")
    return account_id


@router.get("/me")
def get_admin_status(
    account_id: str = Depends(require_sb_token),
):
    """Returns {is_admin: bool} for the current session.
    Used by frontend to show/hide admin UI — no ID exposed to client.
    """
    return {"is_admin": bool(ADMIN_ACCOUNT_ID) and account_id == ADMIN_ACCOUNT_ID}


@router.post("/creators", response_model=CreatorOut, status_code=201)
def admin_create_creator(
    payload: AdminCreatorCreate,
    db: Session = Depends(get_db),
    admin_id: str = Depends(require_admin),
):
    """Create a creator profile on behalf of any soulbolt account.
    Spec decision: no existence check against soulbolt account store —
    orphaned profiles permitted at admin discretion.
    avatar_url and external_link validated as URLs at schema layer (AnyUrl).
    """
    if db.query(CreatorProfile).filter(
        CreatorProfile.soulbolt_account_id == payload.soulbolt_account_id
    ).first():
        raise HTTPException(status_code=409, detail="Creator profile already exists for this account")
    if db.query(CreatorProfile).filter(
        CreatorProfile.handle == payload.handle
    ).first():
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


@router.get("/submissions", response_model=list[ListingOut])
def get_pending_submissions(
    status: str = "PENDING",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin_id: str = Depends(require_admin),
):
    """Returns listings filtered by status. Default: PENDING."""
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
