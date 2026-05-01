import asyncio
import threading
import json
import logging
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from backend.core.config import MEDIA_CACHE_DIR, PEAKS_CACHE_DIR
from backend.core.models import ExtractRequest, FetchRequest, TranscribeRequest
from backend.core.utils import (
    utc_now_iso, 
    normalize_video_id, 
    load_json, 
    save_json,
)
from backend.services.audio_service import (
    find_cached_audio,
    fetch_video_info,
    download_audio,
    iter_file_range,
    parse_range_header,
    compute_peaks
)
from backend.services.transcription_service import (
    JOB_LOCK,
    TRANSCRIBE_JOBS,
    EVENT_QUEUES,
    set_main_loop,
    run_transcription_job,
    transcript_path
)
from extract_lyrics import run_extraction

app = FastAPI(title="LRCLIB Publisher API (refactored)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def metadata_path(video_id: str) -> Path:
    return MEDIA_CACHE_DIR / f"{video_id}.json"

def peaks_path(video_id: str, source: str = "original") -> Path:
    return PEAKS_CACHE_DIR / f"{video_id}_{source}.json"

def load_metadata(video_id: str) -> Optional[dict]:
    return load_json(metadata_path(video_id))

def save_metadata(video_id: str, payload: dict) -> None:
    save_json(metadata_path(video_id), payload)

@app.on_event("startup")
async def startup_event():
    set_main_loop(asyncio.get_running_loop())

@app.post("/local-api/extract")
def extract_lyrics_api(body: ExtractRequest):
    try:
        if not body.url:
            raise HTTPException(status_code=400, detail="Missing YouTube URL")
        return run_extraction(body.url)
    except Exception as exc:
        return {"error": str(exc)}

@app.post("/local-api/fetch")
def fetch_media(body: FetchRequest):
    if not body.url and not body.videoId:
        raise HTTPException(status_code=400, detail="Provide url or videoId")
    
    normalized_vid: Optional[str] = None
    info = None
    
    if body.videoId:
        normalized_vid = normalize_video_id(body.videoId)
        if not normalized_vid:
            raise HTTPException(status_code=400, detail="Invalid videoId")
            
    if body.url:
        info = fetch_video_info(body.url)
        url_video_id = normalize_video_id(info.get("id", ""))
        if not url_video_id:
            raise HTTPException(status_code=400, detail="Cannot resolve videoId from URL")
        if normalized_vid and normalized_vid != url_video_id:
            raise HTTPException(status_code=400, detail="videoId does not match URL")
        normalized_vid = url_video_id

    if not normalized_vid:
        raise HTTPException(status_code=400, detail="Missing resolved videoId")

    metadata = load_metadata(normalized_vid)
    audio_file = find_cached_audio(normalized_vid)
    
    if metadata is None:
        if not body.url:
            raise HTTPException(status_code=404, detail="Cache miss for videoId. Provide URL to fetch and cache media.")
        if info is None:
            info = fetch_video_info(body.url)
        audio_file = download_audio(body.url, normalized_vid)
        metadata = {
            "id": normalized_vid,
            "title": info.get("title", ""),
            "uploader": info.get("uploader", ""),
            "duration": info.get("duration", 0),
            "sourceUrl": body.url,
            "cachedAt": utc_now_iso()
        }
        save_metadata(normalized_vid, metadata)
    elif audio_file is None and body.url:
        audio_file = download_audio(body.url, normalized_vid)

    return {
        "videoId": normalized_vid,
        "trackName": metadata.get("title", ""),
        "artistName": metadata.get("uploader", ""),
        "duration": metadata.get("duration", 0),
        "audioReady": audio_file is not None,
        "audioUrl": f"/local-api/audio/{normalized_vid}" if audio_file else None,
        "cachedAt": metadata.get("cachedAt"),
        "sourceUrl": metadata.get("sourceUrl")
    }

@app.post("/local-api/transcribe")
def transcribe_media(body: TranscribeRequest):
    video_id = normalize_video_id(body.videoId)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid videoId")
        
    output_file = transcript_path(video_id)
    if output_file.exists() and not body.force:
        cached = load_json(output_file)
        if cached:
            with JOB_LOCK:
                TRANSCRIBE_JOBS[video_id] = {
                    "status": "completed",
                    "synced": cached.get("syncedLyrics"),
                    "plain": cached.get("plainLyrics"),
                    "updatedAt": cached.get("updatedAt")
                }
            return {"videoId": video_id, "status": "completed", **TRANSCRIBE_JOBS[video_id]}

    with JOB_LOCK:
        current_job = TRANSCRIBE_JOBS.get(video_id)
        if current_job and current_job.get("status") == "running":
            return {"videoId": video_id, "status": "running", "job": current_job}
        if current_job and current_job.get("status") == "completed":
            return {"videoId": video_id, "status": "completed", **current_job}

    audio_file = find_cached_audio(video_id)
    if audio_file is None:
        raise HTTPException(status_code=404, detail="Audio cache not found. Call /local-api/fetch first.")

    worker = threading.Thread(target=run_transcription_job, args=(video_id, audio_file, True), daemon=True)
    worker.start()
    return {"videoId": video_id, "status": "queued", "message": "Transcription started."}

@app.get("/local-api/transcribe/stream/{video_id}")
async def stream_transcribe_status(video_id: str):
    safe_video_id = normalize_video_id(video_id)
    if not safe_video_id:
        raise HTTPException(status_code=400, detail="Invalid videoId")
        
    async def event_generator():
        q = asyncio.Queue()
        if safe_video_id not in EVENT_QUEUES:
            EVENT_QUEUES[safe_video_id] = set()
        EVENT_QUEUES[safe_video_id].add(q)
        try:
            with JOB_LOCK:
                current = TRANSCRIBE_JOBS.get(safe_video_id)
                if current:
                    yield f"data: {json.dumps({'videoId': safe_video_id, **current})}\n\n"
            while True:
                data = await q.get()
                yield f"data: {json.dumps(data)}\n\n"
                if data.get("status") in ["completed", "failed"]:
                    break
        finally:
            EVENT_QUEUES[safe_video_id].remove(q)
            if not EVENT_QUEUES[safe_video_id]:
                del EVENT_QUEUES[safe_video_id]
                
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/local-api/audio/{video_id}")
def stream_cached_audio(video_id: str, request: Request):
    safe_video_id = normalize_video_id(video_id)
    audio_file = find_cached_audio(safe_video_id)
    if audio_file is None:
        raise HTTPException(status_code=404, detail="Audio not found")
        
    file_size = audio_file.stat().st_size
    content_type = "audio/mpeg"
    range_header = request.headers.get("range")
    
    if range_header:
        start, end = parse_range_header(range_header, file_size)
        content_length = end - start + 1
        headers = {
            "Accept-Ranges": "bytes",
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Content-Length": str(content_length),
            "Content-Type": content_type
        }
        return StreamingResponse(iter_file_range(audio_file, start, end), status_code=206, headers=headers, media_type=content_type)
        
    headers = {"Accept-Ranges": "bytes", "Content-Length": str(file_size)}
    return StreamingResponse(iter_file_range(audio_file, 0, file_size - 1), headers=headers, media_type=content_type)

@app.get("/local-api/peaks/{video_id}")
def get_audio_peaks(video_id: str, samples: int = 800, force: bool = False):
    safe_video_id = normalize_video_id(video_id)
    if samples < 64 or samples > 4000:
        raise HTTPException(status_code=400, detail="samples must be between 64 and 4000")
        
    audio_file = find_cached_audio(safe_video_id)
    if audio_file is None:
        raise HTTPException(status_code=404, detail="Audio cache not found.")
        
    source = "original"
    cache_file = peaks_path(safe_video_id, source)
    if cache_file.exists() and not force:
        cached = load_json(cache_file)
        if cached and cached.get("samples") == samples:
            return {**cached, "cacheHit": True}
            
    metadata = load_metadata(safe_video_id) or {}
    duration = float(metadata.get("duration", 0) or 0)
    peaks = compute_peaks(audio_file, samples)
    
    payload = {
        "videoId": safe_video_id,
        "samples": samples,
        "duration": duration,
        "peaks": peaks,
        "sourceFile": audio_file.name,
        "generatedAt": utc_now_iso(),
        "source": source
    }
    save_json(cache_file, payload)
    return {**payload, "cacheHit": False}

@app.get("/")
def serve_index():
    return FileResponse("index.html")

if __name__ == "__main__":
    logging.info("Starting backend on http://0.0.0.0:8080")
    uvicorn.run("main:app", host="0.0.0.0", port=8080, log_level="info")
