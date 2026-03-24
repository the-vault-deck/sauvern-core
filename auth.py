import os
import httpx
from fastapi import HTTPException, Header, Cookie, Request
from typing import Annotated, Optional

SOULBOLT_API_URL = os.environ.get("SOULBOLT_API_URL", "")


def require_sb_token(
    authorization: Annotated[Optional[str], Header()] = None,
    sb_token: Annotated[Optional[str], Cookie()] = None,
) -> str:
    """
    Validates sb_token against SOULBOLT API.
    Token source priority: Authorization header > sb_token cookie.
    Returns soulbolt_account_id on success.
    Raises 401 on invalid/missing token.
    """
    token: Optional[str] = None

    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
    elif sb_token:
        token = sb_token

    if not token:
        raise HTTPException(status_code=401, detail="Missing or malformed authorization")

    try:
        resp = httpx.post(
            f"{SOULBOLT_API_URL}/auth/validate",
            json={"token": token},
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

    return account_id
