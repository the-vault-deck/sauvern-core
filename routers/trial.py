"""
routers/trial.py
SAUVERN trial acquisition proxy.

Problem: soulbolt.ai/api/start requires a Bearer token in the Authorization
header. Browser navigation (window.location.href) cannot set headers — it
always redirects to /login.

Solution: sauvern-core proxies the request server-side.
  1. Authenticate the user via the sb_token HttpOnly cookie (require_sb_token).
  2. GET soulbolt.ai/api/start?product_id={product_id} with Bearer {sb_token}.
     follow_redirects=False — we read the 302 Location header directly.
  3. soulbolt returns 302 → /tools (success) or 302 → /login (not authed).
  4. Return {redirect_url: "https://soulbolt.ai/tools"} to the frontend.
  5. Frontend does window.location.href = redirect_url.

Never:
  - follows redirects (would land on soulbolt login HTML)
  - exposes the sb_token in a response body
  - bypasses require_sb_token
"""
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Cookie
from typing import Optional
from auth import require_sb_token

router = APIRouter(prefix="/trial", tags=["trial"])

# Use soulbolt.ai (public domain) — not the Railway internal URL.
# Railway internal URL redirects to its own login on 302, not soulbolt.ai/login.
SOULBOLT_PUBLIC_URL = "https://soulbolt.ai/api"
ALLOWED_PRODUCTS = {"cantlie", "tgr", "ironoak", "secondarc", "sauvern", "strikecoin"}
SOULBOLT_BASE = "https://soulbolt.ai"


@router.post("/start")
def start_trial(
    product_id: str,
    account_id: str = Depends(require_sb_token),
    sb_token: Optional[str] = Cookie(default=None),
):
    """
    Proxy GET /api/start on soulbolt with the user's sb_token as Bearer.
    Does NOT follow redirects — reads 302 Location header directly.
    Returns {redirect_url} for the frontend to navigate to.

    Success:  soulbolt returns 302 → /tools  → redirect_url = https://soulbolt.ai/tools
    Unauthed: soulbolt returns 302 → /login  → 401 back to frontend
    """
    if not product_id or product_id not in ALLOWED_PRODUCTS:
        raise HTTPException(status_code=400, detail=f"Unknown product: {product_id}")

    if not sb_token:
        raise HTTPException(status_code=401, detail="Missing auth cookie")

    soulbolt_start_url = f"{SOULBOLT_PUBLIC_URL}/start?product_id={product_id}"

    try:
        resp = httpx.get(
            soulbolt_start_url,
            headers={"Authorization": f"Bearer {sb_token}"},
            follow_redirects=False,  # read Location header, don't follow
            timeout=10.0,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="SOULBOLT unreachable")

    # Expect a 302 redirect
    if resp.status_code not in (301, 302, 303, 307, 308):
        raise HTTPException(
            status_code=502,
            detail=f"Unexpected response from SOULBOLT: {resp.status_code}"
        )

    location = resp.headers.get("location", "")

    # If soulbolt redirected to /login — token was rejected
    if "/login" in location:
        raise HTTPException(status_code=401, detail="SOULBOLT session expired. Please sign in again.")

    # Normalise to absolute URL
    if location.startswith("/"):
        redirect_url = SOULBOLT_BASE + location
    else:
        redirect_url = location

    return {"redirect_url": redirect_url}
