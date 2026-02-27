import base64
import secrets
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from itsdangerous import URLSafeSerializer, BadSignature

from app.config import settings
from app.auth.msal_auth import msal_auth
from app.models.schemas import UserInfo

logger = logging.getLogger(__name__)
router = APIRouter()

_serializer = URLSafeSerializer(settings.SECRET_KEY, salt="session")
GRAPH_BASE = "https://graph.microsoft.com/v1.0"


def _set_session(response: Response, data: dict) -> None:
    signed = _serializer.dumps(data)
    response.set_cookie(
        key="session",
        value=signed,
        httponly=True,
        samesite="lax",
        secure=settings.SECURE_COOKIES,
        max_age=3600 * 8,
    )


def _clear_session(response: Response) -> None:
    response.delete_cookie("session")


def get_session(request: Request) -> Optional[dict]:
    raw = request.cookies.get("session")
    if not raw:
        return None
    try:
        return _serializer.loads(raw)
    except BadSignature:
        return None


def require_session(request: Request) -> dict:
    session = get_session(request)
    if not session or "access_token" not in session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return session


@router.get("/login")
async def login(request: Request) -> RedirectResponse:
    state = secrets.token_urlsafe(32)
    auth_url = msal_auth.get_auth_url(state=state)
    response = RedirectResponse(url=auth_url)
    # Store state in a short-lived cookie for CSRF verification
    response.set_cookie(key="oauth_state", value=state, httponly=True, max_age=600, samesite="lax", secure=settings.SECURE_COOKIES)
    return response


@router.get("/callback")
async def callback(request: Request, code: str = "", state: str = "", error: str = "") -> RedirectResponse:
    if error:
        logger.error("OAuth error: %s", error)
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error={error}")

    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        token_data = msal_auth.get_token_from_code(code=code, state=state)
    except ValueError as exc:
        logger.error("Token exchange failed: %s", exc)
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=token_exchange_failed")

    session_data = {
        "access_token": token_data["access_token"],
        "refresh_token": token_data.get("refresh_token"),
        "id_token_claims": token_data.get("id_token_claims", {}),
    }

    response = RedirectResponse(url=settings.FRONTEND_URL)
    _set_session(response, session_data)
    response.delete_cookie("oauth_state")
    return response


@router.get("/logout")
async def logout() -> Response:
    response = RedirectResponse(url=settings.FRONTEND_URL)
    _clear_session(response)
    return response


@router.get("/me", response_model=UserInfo)
async def me(request: Request) -> UserInfo:
    session = require_session(request)
    access_token = session["access_token"]

    headers = {
        "Authorization": f"Bearer {access_token}",
        "ConsistencyLevel": "eventual",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        profile_resp = await client.get(f"{GRAPH_BASE}/me", headers=headers)
        if profile_resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Access token expired")
        profile_resp.raise_for_status()
        profile = profile_resp.json()

        photo_url: Optional[str] = None
        photo_resp = await client.get(f"{GRAPH_BASE}/me/photo/$value", headers=headers)
        if photo_resp.status_code == 200:
            b64 = base64.b64encode(photo_resp.content).decode("utf-8")
            content_type = photo_resp.headers.get("content-type", "image/jpeg")
            photo_url = f"data:{content_type};base64,{b64}"

    return UserInfo(
        name=profile.get("displayName", ""),
        email=profile.get("mail") or profile.get("userPrincipalName", ""),
        photo_url=photo_url,
    )
