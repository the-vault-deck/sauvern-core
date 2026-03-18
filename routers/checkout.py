import os
import uuid
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import Listing, Purchase
from auth import require_sb_token

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

router = APIRouter()


class CheckoutRequestBody(BaseModel):
    listing_id: str


@router.post("/session")
def create_checkout_session(
    req: CheckoutRequestBody,
    account_id: str = Depends(require_sb_token),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == req.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "unit_amount": 999,  # $9.99 flat — per-listing pricing deferred
                "product_data": {
                    "name": listing.title,
                    "description": (listing.body[:80] + "...") if listing.body else "",
                },
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url="https://sauvern.com/checkout/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=f"https://sauvern.com/{listing.creator_id}/{listing.slug}",
        metadata={
            "listing_id": str(listing.id),
            "buyer_account_id": account_id,
        },
    )
    return {"session_url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})

        purchase = Purchase(
            id=str(uuid.uuid4()),
            listing_id=metadata.get("listing_id"),
            buyer_account_id=metadata.get("buyer_account_id", ""),
            stripe_session_id=session["id"],
            status="completed",
        )
        db.add(purchase)
        db.commit()

    return {"status": "ok"}
