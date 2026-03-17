import re
from sqlalchemy.orm import Session
from models import Listing

def generate_slug(title: str, creator_id: str, db: Session) -> str:
    base = title.lower()
    base = re.sub(r"[^a-z0-9\s-]", "", base)
    base = re.sub(r"\s+", "-", base.strip())
    base = re.sub(r"-+", "-", base)
    base = base[:80].rstrip("-")

    candidate = base
    counter = 2
    while True:
        exists = db.query(Listing).filter(
            Listing.creator_id == creator_id,
            Listing.slug == candidate,
        ).first()
        if not exists:
            return candidate
        candidate = f"{base}-{counter}"
        counter += 1
