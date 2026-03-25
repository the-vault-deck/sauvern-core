import logging
import os
import uuid

import httpx
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_sb_token
from database import get_db
from models import Listing, Purchase

logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")
SOULBOLT_API = "https://soulbolt.ai/api"

router = APIRouter()


class CheckoutRequestBody(BaseModel):
    listing_id: str


def _register_soulbolt_entitlement(sb_token: str, product: str = "sauvern") -> None:
    """
    Call POST soulbolt.ai/api/account/trial/start to register the entitlement.
    409 (active trial already exists) is treated as success — idempotent.
    All other errors are logged and swallowed — Purchase row is the source of
    truth for SAUVERN; soulbolt entitlement is best-effort from here.
    """
    try:
        resp = httpx.post(
            f"{SOULBOLT_API}/account/trial/start",
            json={"product": product},
            headers={"Authorization": f"Bearer {sb_token}"},
            timeout=10.0,
        )
        if resp.status_code in (201, 409):
            # 201 = created, 409 = already active — both are success states
            return
        logger.error(
            "_register_soulbolt_entitlement: unexpected status %s — body: %s",
            resp.status_code,
            resp.text[:200],
        )
    except Exception as exc:
        logger.error("_register_soulbolt_entitlement: request failed — %s", exc)


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
                "unit_amount": listing.price_cents if listing.price_cents else 999,
                "product_data": {
                    "name": listing.title,
                    "description": (listing.description[:80] + "...") if listing.description else "",
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

        buyer_account_id = metadata.get("buyer_account_id", "")

        purchase = Purchase(
            id=str(uuid.uuid4()),
            listing_id=metadata.get("listing_id"),
            buyer_account_id=buyer_account_id,
            stripe_session_id=session["id"],
            status="completed",
        )
        db.add(purchase)
        db.commit()

        # Register sauvern entitlement on soulbolt-v1 so the tool appears
        # under YOUR TOOLS in the SOULBOLT dashboard.
        # Requires the buyer's sb_token. The token is not available server-side
        # from the webhook payload — soulbolt validates tokens, not Stripe.
        # Mitigation: store sb_token in Stripe session metadata at checkout
        # creation time (see /session endpoint — metadata already has account_id).
        # For now: flag this as a known gap — entitlement must be triggered
        # client-side on CheckoutSuccess page load via POST /account/trial/start.
        # See: sauvern-core issue — webhook_entitlement_gap
        logger.info(
            "Purchase committed for buyer %s — entitlement registration deferred to client",
            buyer_account_id,
        )

    return {"status": "ok"}
