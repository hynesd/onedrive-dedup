import msal
from app.config import get_settings

settings = get_settings()

SCOPES = ["Files.Read", "Files.ReadWrite", "User.Read"]

AUTHORITY = f"https://login.microsoftonline.com/{settings.tenant_id}"


def get_msal_app() -> msal.ConfidentialClientApplication:
    return msal.ConfidentialClientApplication(
        client_id=settings.client_id,
        client_credential=settings.client_secret,
        authority=AUTHORITY,
    )


def get_auth_url(state: str) -> str:
    app = get_msal_app()
    return app.get_authorization_request_url(
        scopes=SCOPES,
        state=state,
        redirect_uri=settings.redirect_uri,
    )


def exchange_code_for_token(code: str) -> dict:
    app = get_msal_app()
    result = app.acquire_token_by_authorization_code(
        code=code,
        scopes=SCOPES,
        redirect_uri=settings.redirect_uri,
    )
    return result


def refresh_token(refresh_token_str: str) -> dict:
    app = get_msal_app()
    result = app.acquire_token_by_refresh_token(
        refresh_token=refresh_token_str,
        scopes=SCOPES,
    )
    return result
