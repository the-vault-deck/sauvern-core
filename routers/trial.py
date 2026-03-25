"""
routers/trial.py
SAUVERN trial acquisition proxy.

Problem: soulbolt.ai/api/start requires a Bearer token in the Authorization
header. Browser navigation (window.location.href) cannot set headers — it
always redirects to /login.

Solution: sauvern-core proxies the request server-side.
  1. Authenticate the user via the sb_token HttpOnly cookie (require_sb_token).
  2. Call soulbolt.ai/api/start?product_id={product_id} with Bearer {sb_token}.
  3. Follow the redirect chain — soulbolt returns 302 → /tools.
  4. Return {redirect_url: "https://soulbolt.ai/tools"} to the frontend.
  5. Frontend does window.location.href = redirect_url.

Never:
  - redirects directly from this endpoint (CORS would block it)
  - exposes the sb_token in a response body
  - bypasses require_sb_token (auth still required on sauvern side)
"""
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Cookie
from typing import Optional
from auth import require_sb_token

router = APIRouter(prefix="/trial", tags=["trial"])

SOULBOLT_API_URL = os.environ.get("SOULBOLT_API_URL", "")
ALLOWED_PRODUCTS = {"cantlie", "tgr", "ironoak", "secondarc", "sauvern"}


@router.post("/start")
def start_trial(
    product_id: str,
    account_id: str = Depends(require_sb_token),
    sb_token: Optional[str] = Cookie(default=None),
):
    """
    Proxy GET /api/start on soulbolt-v1 with the user's sb_token as Bearer.
    Returns {redirect_url} for the frontend to navigate to.

    Failure shapes:
      400 — unknown product_id
      401 — not authenticated (require_sb_token fires before this)
      502 — soulbolt unreachable
      500 — unexpected response from soulbolt
    """
    if not product_id or product_id not in ALLOWED_PRODUCTS:
        raise HTTPException(status_code=400, detail=f"Unknown product: {product_id}")

    if not sb_token:
        raise HTTPException(status_code=401, detail="Missing auth cookie")

    soulbolt_start_url = f"{SOULBOLT_API_URL}/start?product_id={product_id}"

    try:
        # follow_redirects=True — soulbolt /api/start returns 302 → /tools
        resp = httpx.get(
            soulbolt_start_url,
            headers={"Authorization": f"Bearer {sb_token}"},
            follow_redirects=True,
            timeout=10.0,
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="SOULBOLT unreachable")

    # After following redirects, final URL should be soulbolt.ai/tools (or /tools)
    # We return that URL to the frontend for navigation.
    final_url = str(resp.url)

    # Normalise: if soulbolt returned a relative /tools path, make it absolute
    if final_url.startswith("/"):
        base = SOULBOLT_API_URL.rstrip("/api")
        final_url = base + final_url

    # Acceptable final destinations: /tools or /login (expired trial)
    # Either way, send it back — frontend handles the landing.
    return {"redirect_url": final_url}
