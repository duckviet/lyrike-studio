import asyncio
import logging

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from core.config import ALLOWED_ORIGINS
from core.rate_limit import limiter
from services.transcription_service import set_main_loop
from routes import local_api, lrclib_proxy, cache_proxy

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="LRCLIB Publisher API")

# Attach the shared limiter so SlowAPI middleware can find it
app.state.limiter = limiter

# ---------------------------------------------------------------------------
# Middleware order matters — outermost is applied last on response, first on request
# ---------------------------------------------------------------------------

# 1. Rate limiting (must come before CORS so abusive pre-flights are also throttled)
app.add_middleware(SlowAPIMiddleware)

# 2. CORS
#    - allow_origins is populated from FRONTEND_URL env var (see config.py)
#    - allow_credentials=True requires explicit origins (not "*")
#    - Preflight OPTIONS requests are handled automatically by this middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Publish-Token",
        "X-Requested-With",
        # Cloudflare passes these on to origin; whitelisting lets browsers read them
        "CF-Ray",
        "CF-Connecting-IP",
    ],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    max_age=600,  # Cache preflight response for 10 minutes
)

# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "detail": "Too many requests. Please slow down.",
            "retry_after": str(exc.retry_after) if hasattr(exc, "retry_after") else "60",
        },
        headers={"Retry-After": "60"},
    )

# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    logging.basicConfig(level=logging.INFO)
    set_main_loop(asyncio.get_running_loop())
    logging.info("[STARTUP] Allowed CORS origins: %s", ALLOWED_ORIGINS)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

app.include_router(local_api.router)
app.include_router(lrclib_proxy.router)
app.include_router(cache_proxy.router)

# Health check — used by Render and Cloudflare health monitors
@app.get("/", tags=["health"])
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "message": "LRCLIB Publisher API is running"}

# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        log_level="info",
        reload=True,
        # Trust Render's internal proxy and Cloudflare
        proxy_headers=True,
        forwarded_allow_ips="*",
    )
