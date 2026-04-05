import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import uvicorn
import os

# Import our refactored extraction logic
from extract_lyrics import run_extraction

app = FastAPI(title="LRCLIB Publisher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractRequest(BaseModel):
    url: str

# Local API to extract lyrics
@app.post("/local-api/extract")
def extract_lyrics_api(body: ExtractRequest):
    try:
        if not body.url:
            raise HTTPException(status_code=400, detail="Missing YouTube URL")
        # run_extraction is synchronous and will run in FastAPI's threadpool so it won't block other requests
        data = run_extraction(body.url)
        return data
    except Exception as e:
        return {"error": str(e)}

# Proxy LRCLIB APIs
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_lrclib(path: str, request: Request):
    client = httpx.AsyncClient()
    url = f"https://lrclib.net/api/{path}"
    
    # Forward headers but remove host and avoid double encoding
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("origin", None)
    headers.pop("referer", None)
    headers.pop("accept-encoding", None)
    
    body = await request.body()

    try:
        req = client.build_request(
            method=request.method,
            url=url,
            headers=headers,
            content=body
        )
        response = await client.send(req, stream=True)
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers={k: v for k, v in response.headers.items() if k.lower() not in ('content-encoding', 'content-length', 'transfer-encoding')}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy Error: {str(e)}")

# Fallback: Serve static files
@app.get("/")
def serve_index():
    return FileResponse("index.html")

@app.get("/{file_path:path}")
def serve_static(file_path: str):
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    # Default fallback to index.html mimicking SPA behavior
    return FileResponse("index.html")

if __name__ == "__main__":
    logging.info("\n==============================================")
    logging.info("🚀 FastAPI Backend is running! ✅ ")
    logging.info("👉 Open your browser at: http://localhost:8080/")
    logging.info("==============================================\n")
    uvicorn.run("main:app", host="0.0.0.0", port=8080, log_level="info", reload=True)
