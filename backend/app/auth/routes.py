import secrets
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse

from app.auth.msal_auth import get_auth_url, exchange_code_for_token, refresh_token
from app.config import get_settings

settings = get_settings()
router = APIRouter()


@router.get("/login")
async def login(request: Request):
    state = secrets.token_urlsafe(16)
    request.session["oauth_state"] = state
    auth_url = get_auth_url(state)
    return {"auth_url": auth_url}


@router.get("/callback")
async def callback(request: Request, code: str = None, state: str = None, error: str = None):
    if error:
        return RedirectResponse(url=f"{settings.frontend_url}?error={error}")

    session_state = request.session.get("oauth_state")
    if not state or state != session_state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    if not code:
        raise HTTPException(status_code=400, detail="No authorization code received")

    result = exchange_code_for_token(code)

    if "error" in result:
        return RedirectResponse(
            url=f"{settings.frontend_url}?error={result.get('error_description', 'auth_failed')}"
        )

    request.session["access_token"] = result.get("access_token")
    request.session["refresh_token"] = result.get("refresh_token")
    request.session["id_token_claims"] = result.get("id_token_claims", {})

    return RedirectResponse(url=f"{settings.frontend_url}/dashboard")


@router.get("/me")
async def get_me(request: Request):
    token = request.session.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    claims = request.session.get("id_token_claims", {})
    return {
        "name": claims.get("name", ""),
        "email": claims.get("preferred_username", claims.get("upn", "")),
        "id": claims.get("oid", ""),
    }


@router.post("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out"}


@router.post("/refresh")
async def refresh(request: Request):
    rt = request.session.get("refresh_token")
    if not rt:
        raise HTTPException(status_code=401, detail="No refresh token")

    result = refresh_token(rt)
    if "error" in result:
        raise HTTPException(status_code=401, detail="Token refresh failed")

    request.session["access_token"] = result.get("access_token")
    if result.get("refresh_token"):
        request.session["refresh_token"] = result.get("refresh_token")

    return {"message": "Token refreshed"}
