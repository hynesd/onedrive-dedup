from typing import Optional
import msal
from app.config import settings

SCOPES = ["Files.Read", "Files.ReadWrite", "User.Read", "offline_access"]


class MSALAuth:
    """Wrapper around msal.ConfidentialClientApplication.

    The underlying MSAL app is created lazily on first access so that
    importing this module does not trigger a network call to the
    Microsoft OIDC discovery endpoint (which would fail in environments
    without internet access such as CI).
    """

    def __init__(self) -> None:
        self._msal_app: Optional[msal.ConfidentialClientApplication] = None

    @property
    def _app(self) -> msal.ConfidentialClientApplication:
        if self._msal_app is None:
            self._msal_app = msal.ConfidentialClientApplication(
                client_id=settings.CLIENT_ID,
                client_credential=settings.CLIENT_SECRET,
                authority=f"https://login.microsoftonline.com/{settings.TENANT_ID}",
            )
        return self._msal_app

    def get_auth_url(self, state: str) -> str:
        result = self._app.get_authorization_request_url(
            scopes=SCOPES,
            state=state,
            redirect_uri=settings.REDIRECT_URI,
        )
        return result

    def get_token_from_code(self, code: str, state: str) -> dict:
        result = self._app.acquire_token_by_authorization_code(
            code=code,
            scopes=SCOPES,
            redirect_uri=settings.REDIRECT_URI,
        )
        if "error" in result:
            raise ValueError(f"Token acquisition failed: {result.get('error_description', result['error'])}")
        return result

    def get_token_from_cache(self, account) -> Optional[dict]:
        result = self._app.acquire_token_silent(scopes=SCOPES, account=account)
        if result and "access_token" in result:
            return result
        return None

    def refresh_token(self, refresh_token_str: str) -> Optional[dict]:
        result = self._app.acquire_token_by_refresh_token(
            refresh_token=refresh_token_str,
            scopes=SCOPES,
        )
        if result and "access_token" in result:
            return result
        return None


msal_auth = MSALAuth()
