import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api", tags=["lrclib"])

LRCLIB_API_BASE = "https://lrclib.net"

@router.post("/request-challenge")
async def request_challenge():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(f"{LRCLIB_API_BASE}/api/request-challenge")
            return StreamingResponse(
                resp.aiter_bytes(),
                status_code=resp.status_code,
                media_type=resp.headers.get("Content-Type")
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/publish")
async def publish(request: Request):
    payload = await request.json()
    token = request.headers.get("X-Publish-Token")
    async with httpx.AsyncClient() as client:
        try:
            headers = {"Content-Type": "application/json"}
            if token:
                headers["X-Publish-Token"] = token
            
            resp = await client.post(
                f"{LRCLIB_API_BASE}/api/publish",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            return StreamingResponse(
                resp.aiter_bytes(),
                status_code=resp.status_code,
                media_type=resp.headers.get("Content-Type")
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
