"""
routers/admin.py
SAUVERN admin endpoints — submission review queue.
Gated by SAUVERN_ADMIN_ACCOUNT_ID env var.
Only the account matching that ID can access these routes.
"""
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Listing, ListingIndex
from schemas import ListingOut, AdminRejectRequest
from auth import require_sb_token

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_ACCOUNT_ID = os.environ.get("SAUVERN_ADMIN_ACCOUNT_ID", "")


def require_admin(account_id: str = Depends(require_sb_token)) -> str:
    if not ADMIN_ACCOUNT_ID:
        raise HTTPException(status_code=503, detail="Admin not configured")
    if account_id != ADMIN_ACCOUNT_ID:
        raise HTTPException(status_code=403, detail="Forbidden")
    return account_id


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

    # Insert into listing_index if not already present
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

    # Remove from index if somehow it got in
    index_entry = db.query(ListingIndex).filter(ListingIndex.listing_id == listing_id).first()
    if index_entry:
        db.delete(index_entry)

    db.commit()
    db.refresh(listing)
    return listing
