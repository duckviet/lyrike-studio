#main.py
import json
import logging
import mimetypes
import os
import re
import threading
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set

import httpx
import uvicorn
import yt_dlp
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

app = FastAPI(title="LRCLIB Publisher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    global MAIN_LOOP
    MAIN_LOOP = asyncio.get_running_loop()

CACHE_ROOT = Path(".cache")
MEDIA_CACHE_DIR = CACHE_ROOT / "media"
TRANSCRIPT_CACHE_DIR = CACHE_ROOT / "transcripts"
PEAKS_CACHE_DIR = CACHE_ROOT / "peaks"

for d in [MEDIA_CACHE_DIR, TRANSCRIPT_CACHE_DIR, PEAKS_CACHE_DIR]:
    d.mkdir(parents=True, exist_ok=True)

JOB_LOCK = threading.Lock()
TRANSCRIBE_JOBS: Dict[str, Dict[str, str]] = {}
EVENT_QUEUES: Dict[str, Set[asyncio.Queue]] = {}
MAIN_LOOP: Optional[asyncio.AbstractEventLoop] = None


def broadcast_status(video_id: str, data: dict):
    if video_id in EVENT_QUEUES:
        for q in EVENT_QUEUES[video_id]:
            if MAIN_LOOP:
                MAIN_LOOP.call_soon_threadsafe(q.put_nowait, data)


def get_extractor_functions():
    try:
        from extract_lyrics import process_audio, run_extraction

        return process_audio, run_extraction
    except ModuleNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Transcription dependencies are not installed. "
                "Install whisperx and related packages to enable this endpoint."
            ),
        ) from exc


class ExtractRequest(BaseModel):
    url: str


class FetchRequest(BaseModel):
    url: Optional[str] = None
    videoId: Optional[str] = None


class TranscribeRequest(BaseModel):
    videoId: str
    force: bool = False


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def metadata_path(video_id: str) -> Path:
    return MEDIA_CACHE_DIR / f"{video_id}.json"


def transcript_path(video_id: str) -> Path:
    return TRANSCRIPT_CACHE_DIR / f"{video_id}.json"


def peaks_path(video_id: str) -> Path:
    return PEAKS_CACHE_DIR / f"{video_id}.json"


def vocals_path(video_id: str) -> Path:
    return MEDIA_CACHE_DIR / f"{video_id}_vocals.wav"


def normalize_video_id(raw_video_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]", "", raw_video_id.strip())


def load_json(path: Path) -> Optional[dict]:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=True), encoding="utf-8")


def load_metadata(video_id: str) -> Optional[dict]:
    return load_json(metadata_path(video_id))


def save_metadata(video_id: str, payload: dict) -> None:
    save_json(metadata_path(video_id), payload)


def find_cached_audio(video_id: str, prefer_vocals: bool = False) -> Optional[Path]:
    if prefer_vocals:
        vpath = vocals_path(video_id)
        if vpath.exists():
            return vpath

    candidates = sorted(MEDIA_CACHE_DIR.glob(f"{video_id}.*"))
    for path in candidates:
        if path.suffix.lower() == ".json":
            continue
        if "_vocals" in path.name:
            continue
        if path.is_file():
            return path
    
    # Fallback to vocals if no original found
    vpath = vocals_path(video_id)
    if vpath.exists():
        return vpath
        
    return None


def fetch_video_info(url: str) -> dict:
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        return ydl.extract_info(url, download=False)


def download_audio(url: str, video_id: str) -> Path:
    outtmpl = str(MEDIA_CACHE_DIR / f"{video_id}.%(ext)s")
    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "outtmpl": outtmpl,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        downloaded = Path(ydl.prepare_filename(info))

    if downloaded.exists():
        return downloaded

    cached = find_cached_audio(video_id)
    if cached is None:
        raise HTTPException(status_code=500, detail="Audio download failed")
    return cached


def iter_file_range(path: Path, start: int, end: int, chunk_size: int = 64 * 1024):
    with path.open("rb") as handle:
        handle.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            data = handle.read(min(chunk_size, remaining))
            if not data:
                break
            remaining -= len(data)
            yield data


def parse_range_header(range_header: str, file_size: int) -> tuple[int, int]:
    match = re.match(r"bytes=(\d*)-(\d*)", range_header)
    if not match:
        raise HTTPException(status_code=416, detail="Invalid Range header")

    start_text, end_text = match.groups()
    if start_text == "" and end_text == "":
        raise HTTPException(status_code=416, detail="Invalid Range header")

    if start_text == "":
        suffix_length = int(end_text)
        if suffix_length <= 0:
            raise HTTPException(status_code=416, detail="Invalid Range header")
        start = max(file_size - suffix_length, 0)
        end = file_size - 1
    else:
        start = int(start_text)
        end = int(end_text) if end_text else file_size - 1

    if start >= file_size or end >= file_size or start > end:
        raise HTTPException(status_code=416, detail="Requested Range Not Satisfiable")

    return start, end


def build_fetch_payload(video_id: str, metadata: dict, audio_path: Optional[Path]) -> dict:
    has_vocals = vocals_path(video_id).exists()
    return {
        "videoId": video_id,
        "trackName": metadata.get("title", ""),
        "artistName": metadata.get("uploader", ""),
        "duration": metadata.get("duration", 0),
        "audioReady": audio_path is not None,
        "audioUrl": f"/local-api/audio/{video_id}" if audio_path else None,
        "hasVocals": has_vocals,
        "cachedAt": metadata.get("cachedAt"),
        "sourceUrl": metadata.get("sourceUrl"),
    }


def compute_peaks(audio_path: Path, samples: int) -> list[float]:
    import subprocess
    import numpy as np

    # Use ffmpeg to extract mono PCM data at a low sample rate
    # We target about 10x the requested samples to have enough data for a good peak
    target_ar = max(1000, (samples * 10) // 60) # Rough estimate

    cmd = [
        "ffmpeg",
        "-i", str(audio_path),
        "-f", "f32le",
        "-acodec", "pcm_f32le",
        "-ac", "1",
        "-ar", str(target_ar),
        "-loglevel", "error",
        "-"
    ]

    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, _ = process.communicate()
        if process.returncode != 0:
            return []

        data = np.frombuffer(out, dtype=np.float32)
        if len(data) == 0:
            return []

        # Compute peaks for each bucket
        bucket_size = len(data) // samples
        if bucket_size == 0:
            return [round(float(np.max(np.abs(data))), 4)] * samples

        peaks = []
        for i in range(samples):
            start = i * bucket_size
            end = (i + 1) * bucket_size
            chunk = data[start:end]
            if len(chunk) > 0:
                peaks.append(round(float(np.max(np.abs(chunk))), 4))
            else:
                peaks.append(0.0)

        # Normalize peaks to 0-1 range if they exceed it (rare for PCM f32le)
        max_peak = max(peaks) if peaks else 0
        if max_peak > 1.0:
            peaks = [round(p / max_peak, 4) for p in peaks]

        return peaks
    except Exception as exc:
        logging.error(f"Peak computation failed: {exc}")
        return []


def build_peaks_payload(video_id: str, audio_path: Path, duration: float, samples: int) -> dict:
    peaks = compute_peaks(audio_path, samples)
    return {
        "videoId": video_id,
        "samples": samples,
        "duration": duration,
        "peaks": peaks,
        "sourceFile": audio_path.name,
        "generatedAt": utc_now_iso(),
    }


def run_transcription_job(video_id: str, audio_path: Path, use_demucs: bool = True) -> None:
    status_data = {
        "status": "running",
        "startedAt": utc_now_iso(),
        "updatedAt": utc_now_iso(),
    }
    with JOB_LOCK:
        TRANSCRIBE_JOBS[video_id] = status_data
    
    broadcast_status(video_id, {"videoId": video_id, **status_data})

    try:
        process_audio, _ = get_extractor_functions()
        vocal_out = vocals_path(video_id)
        
        # Use demucs to extract vocals, and save to persistent cache
        synced_lyrics, plain_lyrics = process_audio(
            str(audio_path), 
            use_demucs=use_demucs,
            output_vocal_path=str(vocal_out) if use_demucs else None
        )
        
        payload = {
            "videoId": video_id,
            "syncedLyrics": synced_lyrics,
            "plainLyrics": plain_lyrics,
            "updatedAt": utc_now_iso(),
        }
        save_json(transcript_path(video_id), payload)
        
        final_status = {
            "status": "completed",
            "synced": synced_lyrics,
            "plain": plain_lyrics,
            "updatedAt": utc_now_iso(),
        }
        with JOB_LOCK:
            TRANSCRIBE_JOBS[video_id] = final_status
            
        broadcast_status(video_id, {"videoId": video_id, **final_status})
    except Exception as exc:
        logging.error(f"Transcription job failed for {video_id}: {exc}")
        error_status = {
            "status": "failed",
            "error": str(exc),
            "updatedAt": utc_now_iso(),
        }
        with JOB_LOCK:
            TRANSCRIBE_JOBS[video_id] = error_status
        broadcast_status(video_id, {"videoId": video_id, **error_status})


@app.post("/local-api/extract")
def extract_lyrics_api(body: ExtractRequest):
    try:
        if not body.url:
            raise HTTPException(status_code=400, detail="Missing YouTube URL")
        _, run_extraction = get_extractor_functions()
        return run_extraction(body.url)
    except Exception as exc:
        return {"error": str(exc)}


@app.post("/local-api/fetch")
def fetch_media(body: FetchRequest):
    if not body.url and not body.videoId:
        raise HTTPException(status_code=400, detail="Provide url or videoId")

    normalized_video_id: Optional[str] = None
    info = None

    if body.videoId:
        normalized_video_id = normalize_video_id(body.videoId)
        if not normalized_video_id:
            raise HTTPException(status_code=400, detail="Invalid videoId")

    if body.url:
        info = fetch_video_info(body.url)
        url_video_id = normalize_video_id(info.get("id", ""))
        if not url_video_id:
            raise HTTPException(status_code=400, detail="Cannot resolve videoId from URL")
        if normalized_video_id and normalized_video_id != url_video_id:
            raise HTTPException(status_code=400, detail="videoId does not match URL")
        normalized_video_id = url_video_id

    if not normalized_video_id:
        raise HTTPException(status_code=400, detail="Missing resolved videoId")

    metadata = load_metadata(normalized_video_id)
    audio_file = find_cached_audio(normalized_video_id)

    if metadata is None:
        if not body.url:
            raise HTTPException(
                status_code=404,
                detail="Cache miss for videoId. Provide URL to fetch and cache media.",
            )
        if info is None:
            info = fetch_video_info(body.url)
        audio_file = download_audio(body.url, normalized_video_id)
        metadata = {
            "id": normalized_video_id,
            "title": info.get("title", ""),
            "uploader": info.get("uploader", ""),
            "duration": info.get("duration", 0),
            "sourceUrl": body.url,
            "cachedAt": utc_now_iso(),
        }
        save_metadata(normalized_video_id, metadata)
    elif audio_file is None and body.url:
        audio_file = download_audio(body.url, normalized_video_id)

    return build_fetch_payload(normalized_video_id, metadata, audio_file)


@app.post("/local-api/transcribe")
def transcribe_media(body: TranscribeRequest):
    video_id = normalize_video_id(body.videoId)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid videoId")

    output_file = transcript_path(video_id)
    if output_file.exists() and not body.force:
        cached = load_json(output_file)
        if cached:
            # Populate memory cache
            with JOB_LOCK:
                TRANSCRIBE_JOBS[video_id] = {
                    "status": "completed",
                    "synced": cached.get("syncedLyrics"),
                    "plain": cached.get("plainLyrics"),
                    "updatedAt": cached.get("updatedAt"),
                }
            return {
                "videoId": video_id,
                "status": "completed",
                "synced": cached.get("syncedLyrics"),
                "plain": cached.get("plainLyrics"),
                "updatedAt": cached.get("updatedAt"),
            }

    with JOB_LOCK:
        current_job = TRANSCRIBE_JOBS.get(video_id)
        if current_job and current_job.get("status") == "running":
            return {
                "videoId": video_id,
                "status": "running",
                "job": current_job,
            }
        if current_job and current_job.get("status") == "completed":
            return {
                "videoId": video_id,
                "status": "completed",
                "synced": current_job.get("synced"),
                "plain": current_job.get("plain"),
                "updatedAt": current_job.get("updatedAt"),
            }

    audio_file = find_cached_audio(video_id)
    if audio_file is None:
        raise HTTPException(
            status_code=404,
            detail="Audio cache not found. Call /local-api/fetch with URL first.",
        )

    worker = threading.Thread(
        target=run_transcription_job,
        args=(video_id, audio_file, True), # Set use_demucs=True by default
        daemon=True,
    )
    worker.start()
    return {
        "videoId": video_id,
        "status": "queued",
        "message": "Transcription started.",
    }


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
            # Send current status immediately
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
def stream_cached_audio(video_id: str, request: Request, vocals: bool = True):
    safe_video_id = normalize_video_id(video_id)
    if not safe_video_id:
        raise HTTPException(status_code=400, detail="Invalid videoId")

    # Prefer vocals if requested and available
    audio_file = find_cached_audio(safe_video_id, prefer_vocals=vocals)
    if audio_file is None:
        raise HTTPException(status_code=404, detail="Audio not found in cache")

    file_size = audio_file.stat().st_size
    content_type = mimetypes.guess_type(audio_file.name)[0] or "audio/mpeg"
    range_header = request.headers.get("range")

    if range_header:
        start, end = parse_range_header(range_header, file_size)
        content_length = end - start + 1
        headers = {
            "Accept-Ranges": "bytes",
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Content-Length": str(content_length),
            "Content-Type": content_type,
        }
        return StreamingResponse(
            iter_file_range(audio_file, start, end),
            status_code=206,
            headers=headers,
            media_type=content_type,
        )

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
    }
    return StreamingResponse(
        iter_file_range(audio_file, 0, file_size - 1),
        headers=headers,
        media_type=content_type,
    )


@app.get("/local-api/peaks/{video_id}")
def get_audio_peaks(video_id: str, samples: int = 800, force: bool = False, vocals: bool = True):
    safe_video_id = normalize_video_id(video_id)
    if not safe_video_id:
        raise HTTPException(status_code=400, detail="Invalid videoId")

    if samples < 64 or samples > 4000:
        raise HTTPException(status_code=400, detail="samples must be between 64 and 4000")

    audio_file = find_cached_audio(safe_video_id, prefer_vocals=vocals)
    if audio_file is None:
        raise HTTPException(
            status_code=404,
            detail="Audio cache not found. Call /local-api/fetch with URL first.",
        )

    cache_file = peaks_path(safe_video_id)
    if cache_file.exists() and not force:
        cached = load_json(cache_file)
        if cached and cached.get("samples") == samples:
            return {
                **cached,
                "cacheHit": True,
            }

    metadata = load_metadata(safe_video_id) or {}
    duration = float(metadata.get("duration", 0) or 0)
    payload = build_peaks_payload(safe_video_id, audio_file, duration, samples)
    save_json(cache_file, payload)
    return {
        **payload,
        "cacheHit": False,
    }


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
)
async def proxy_lrclib(path: str, request: Request):
    client = httpx.AsyncClient()
    url = f"https://lrclib.net/api/{path}"

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
            content=body,
        )
        response = await client.send(req, stream=True)
        filtered_headers = {
            key: value
            for key, value in response.headers.items()
            if key.lower() not in ("content-encoding", "content-length", "transfer-encoding")
        }
        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=filtered_headers,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Proxy Error: {str(exc)}") from exc


@app.get("/")
def serve_index():
    return FileResponse("index.html")


@app.get("/{file_path:path}")
def serve_static(file_path: str):
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse("index.html")


if __name__ == "__main__":
    logging.info("==============================================")
    logging.info("FastAPI backend is running")
    logging.info("Open your browser at: http://localhost:8080/")
    logging.info("==============================================")
    uvicorn.run("main:app", host="0.0.0.0", port=8080, log_level="info", reload=True)
