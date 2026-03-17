from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import ListingIndex, Listing
from schemas import ListingOut

router = APIRouter(prefix="/listings/index", tags=["index"])

@router.get("", response_model=list[ListingOut])
def get_listing_index(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    entries = (
        db.query(ListingIndex)
        .options(joinedload(ListingIndex.listing))
        .order_by(ListingIndex.published_at.desc())
        .offset(skip).limit(limit).all()
    )
    return [e.listing for e in entries]
