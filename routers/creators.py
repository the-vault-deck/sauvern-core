from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import CreatorProfile
from schemas import CreatorCreate, CreatorUpdate, CreatorOut, ScoreOut
from auth import require_sb_token
from services.influence import fetch_and_cache

router = APIRouter(prefix="/creators", tags=["creators"])

@router.get("", response_model=list[CreatorOut])
def list_creators(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    creators = (
        db.query(CreatorProfile)
        .order_by(CreatorProfile.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    return [_to_out(c) for c in creators]

@router.get("/{handle}", response_model=CreatorOut)
def get_creator(handle: str, db: Session = Depends(get_db)):
    creator = db.query(CreatorProfile).filter(CreatorProfile.handle == handle).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    fetch_and_cache(db, creator)
    return _to_out(creator)

@router.post("", response_model=CreatorOut, status_code=201)
def create_creator(
    payload: CreatorCreate,
    db: Session = Depends(get_db),
    account_id: str = Depends(require_sb_token),
):
    if db.query(CreatorProfile).filter(CreatorProfile.soulbolt_account_id == account_id).first():
        raise HTTPException(status_code=409, detail="Creator profile already exists for this account")
    if db.query(CreatorProfile).filter(CreatorProfile.handle == payload.handle).first():
        raise HTTPException(status_code=409, detail="Handle already taken")

    creator = CreatorProfile(
        soulbolt_account_id=account_id,
        handle=payload.handle,
        display_name=payload.display_name,
        bio=payload.bio,
        avatar_url=payload.avatar_url,
    )
    db.add(creator)
    db.commit()
    db.refresh(creator)
    return _to_out(creator)

@router.patch("/{handle}", response_model=CreatorOut)
def update_creator(
    handle: str,
    payload: CreatorUpdate,
    db: Session = Depends(get_db),
    account_id: str = Depends(require_sb_token),
):
    creator = db.query(CreatorProfile).filter(CreatorProfile.handle == handle).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    if creator.soulbolt_account_id != account_id:
        raise HTTPException(status_code=403, detail="Not your profile")

    if payload.display_name is not None:
        creator.display_name = payload.display_name
    if payload.bio is not None:
        creator.bio = payload.bio
    if payload.avatar_url is not None:
        creator.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(creator)
    return _to_out(creator)

@router.get("/{handle}/score", response_model=ScoreOut)
def get_score(handle: str, db: Session = Depends(get_db)):
    creator = db.query(CreatorProfile).filter(CreatorProfile.handle == handle).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return ScoreOut(
        handle=creator.handle,
        influence_score_display=creator.influence_score_cache / 10000,
        cached_at=creator.score_cached_at,
    )

def _to_out(c: CreatorProfile) -> CreatorOut:
    return CreatorOut(
        id=c.id,
        soulbolt_account_id=c.soulbolt_account_id,
        handle=c.handle,
        display_name=c.display_name,
        bio=c.bio,
        avatar_url=c.avatar_url,
        influence_score_display=c.influence_score_cache / 10000,
        created_at=c.created_at,
    )
