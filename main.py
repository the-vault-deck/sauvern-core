import logging
logging.basicConfig(level=logging.DEBUG)

import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import httpx
from routers import creators, listings, index, checkout, submissions, admin, trial

SOULBOLT_API_URL = os.environ.get("SOULBOLT_API_URL", "")
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days

app = FastAPI(
    title="sauvern-core",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

app.include_router(creators.router, prefix="/api")
app.include_router(index.router, prefix="/api")       # before listings — avoids /listings/index shadowing
app.include_router(listings.router, prefix="/api")
app.include_router(checkout.router, prefix="/api/checkout", tags=["checkout"])
app.include_router(submissions.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(trial.router, prefix="/api")


# ---------------------------------------------------------------------------
# SSO endpoints — cookie issuance and logout
# These are the only two endpoints that touch the sb_token cookie.
# ---------------------------------------------------------------------------

class SSOTokenRequest(BaseModel):
    sb_token: str


@app.post("/api/auth/sso")
async def sso_token(body: SSOTokenRequest):
    """
    Public endpoint. Receives sb_token from the frontend after SOULBOLT SSO redirect.
    Validates the token against SOULBOLT API, then issues an HttpOnly cookie
    scoped to sauvern.com. Frontend never stores the token — cookie is sent
    automatically by the browser on all subsequent requests.

    Failure response shapes (all declared, no silent failures):
      400 {"detail": "sb_token required"}         — empty body field
      401 {"detail": "Invalid or expired token"}  — soulbolt /auth/validate returned non-200
      401 {"detail": "Token validation returned no account ID"} — soulbolt response missing field
      503 {"detail": "Auth service unreachable"}  — httpx.RequestError (network / timeout)
    Success:
      200 {"ok": true, "soulbolt_account_id": "<uuid>"} + Set-Cookie: sb_token (HttpOnly)
    """
    if not body.sb_token:
        raise HTTPException(status_code=400, detail="sb_token required")

    try:
        resp = httpx.post(
            f"{SOULBOLT_API_URL}/auth/validate",
            json={"token": body.sb_token},
            timeout=5.0,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Auth service unreachable")

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    data = resp.json()
    account_id = data.get("soulbolt_account_id")
    if not account_id:
        raise HTTPException(status_code=401, detail="Token validation returned no account ID")

    response = JSONResponse(content={"ok": True, "soulbolt_account_id": account_id})
    response.set_cookie(
        key="sb_token",
        value=body.sb_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )
    return response


@app.post("/api/auth/logout")
async def logout():
    """
    Clears the sb_token cookie. Frontend redirects to SOULBOLT after calling this.
    Success: 200 {"ok": true}
    """
    response = JSONResponse(content={"ok": True})
    response.delete_cookie(key="sb_token", path="/")
    return response


@app.get("/health")
def health():
    return {"status": "ok", "service": "sauvern-core"}


# Static files + SPA catch-all — must come after all API routes
DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def spa_catchall(full_path: str):
        return FileResponse(os.path.join(DIST, "index.html"))
