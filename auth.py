import os
import httpx
from fastapi import HTTPException, Header
from typing import Annotated

SOULBOLT_API_URL = os.environ.get("SOULBOLT_API_URL", "")

def require_sb_token(authorization: Annotated[str | None, Header()] = None) -> str:
    """
    Validates sb_token against SOULBOLT API.
    Returns soulbolt_account_id on success.
    Raises 401 on invalid/missing token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed authorization header")

    token = authorization.removeprefix("Bearer ").strip()

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
