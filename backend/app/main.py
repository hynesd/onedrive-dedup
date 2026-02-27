import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.auth.routes import router as auth_router
from app.onedrive.routes import router as onedrive_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OneDrive Deduplicator API",
    description="Backend API for scanning and removing duplicate files on OneDrive",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(onedrive_router, prefix="/onedrive", tags=["onedrive"])


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("OneDrive Deduplicator API starting up")


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "ok"}
