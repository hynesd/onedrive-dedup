from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.auth.routes import router as auth_router
from app.onedrive.routes import router as onedrive_router

settings = get_settings()

app = FastAPI(title="OneDrive Dedup API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(onedrive_router, prefix="/api", tags=["onedrive"])


@app.get("/health")
async def health():
    return {"status": "ok"}
