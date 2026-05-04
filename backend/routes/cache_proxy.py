"""
Cache proxy routes — serves audio, peaks, and transcripts from:
  1. Cloudflare R2 (CDN), if CDN_ENABLED and the object exists there.
  2. Local disk cache, as a fallback.

URL design (compatible with Cloudflare Worker pattern):
  GET /cache/audio/{video_id}?source=original|vocal
  GET /cache/peaks/{video_id}?source=original|demucs
  GET /cache/transcript/{video_id}

These routes set proper Cache-Control headers so Cloudflare (or any CDN in
front of Render) caches the responses at the edge automatically.
"""

from __future__ import annotations

import json
import logging
from typing import Literal

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse

from core.config import CDN_ENABLED, CDN_PUBLIC_BASE_URL
from core.rate_limit import limiter
from services.audio_service import find_cached_audio, iter_file_range, parse_range_header
from services.metadata_service import load_peaks, load_transcript, peaks_path, transcript_path

logger = logging.getLogger("cache_proxy")

router = APIRouter(prefix="/cache", tags=["cache-proxy"])

# Cache-Control values — tune as needed
_CC_AUDIO = "public, max-age=86400, stale-while-revalidate=3600"   # 24 h
_CC_PEAKS = "public, max-age=3600,  stale-while-revalidate=300"    # 1 h
_CC_TRANSCRIPT = "public, max-age=600,  stale-while-revalidate=60" # 10 min


# ---------------------------------------------------------------------------
# Audio
# ---------------------------------------------------------------------------

@router.get("/audio/{video_id}")
@limiter.limit("120/minute")
async def cache_audio(
    request: Request,
    video_id: str,
    source: Literal["original", "vocal"] = "original",
):
    """
    Stream audio. Tries R2 first, falls back to local disk.
    Supports HTTP Range requests for seek support.
    """
    if CDN_ENABLED:
        from services.cdn_service import audio_key, exists_in_cdn, stream_object

        key = audio_key(video_id, source)
        if exists_in_cdn(video_id, "audio", source):
            logger.info("CDN hit: %s", key)
            return StreamingResponse(
                stream_object(key),
                media_type="audio/mp4",
                headers={"Cache-Control": _CC_AUDIO},
            )
        logger.info("CDN miss for audio/%s/%s, falling back to disk", video_id, source)

    # --- Local disk fallback ---
    audio_file = find_cached_audio(video_id)
    if audio_file is None:
        raise HTTPException(status_code=404, detail="Audio not cached. Call /local-api/fetch first.")

    file_size = audio_file.stat().st_size
    ext = audio_file.suffix.lower()
    content_type = "audio/mp4" if ext == ".m4a" else "audio/wav" if ext == ".wav" else "audio/mpeg"
    range_header = request.headers.get("range")

    headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": _CC_AUDIO,
    }

    if range_header:
        start, end = parse_range_header(range_header, file_size)
        headers.update({
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Content-Length": str(end - start + 1),
        })
        return StreamingResponse(
            iter_file_range(audio_file, start, end),
            status_code=206,
            headers=headers,
            media_type=content_type,
        )

    headers["Content-Length"] = str(file_size)
    return StreamingResponse(
        iter_file_range(audio_file, 0, file_size - 1),
        headers=headers,
        media_type=content_type,
    )


# ---------------------------------------------------------------------------
# Peaks
# ---------------------------------------------------------------------------

@router.get("/peaks/{video_id}")
@limiter.limit("120/minute")
async def cache_peaks(
    request: Request,
    video_id: str,
    source: Literal["original", "demucs"] = "original",
):
    """Return waveform peaks JSON. Tries R2 first, falls back to local disk."""
    if CDN_ENABLED:
        from services.cdn_service import exists_in_cdn, peaks_key, stream_object

        key = peaks_key(video_id, source)
        if exists_in_cdn(video_id, "peaks", source):
            logger.info("CDN hit: %s", key)
            return StreamingResponse(
                stream_object(key),
                media_type="application/json",
                headers={"Cache-Control": _CC_PEAKS},
            )
        logger.info("CDN miss for peaks/%s/%s, falling back to disk", video_id, source)

    # --- Local disk fallback ---
    data = load_peaks(video_id, source)
    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Peaks not found for source='{source}'. Run transcription or fetch first.",
        )
    return JSONResponse(content=data, headers={"Cache-Control": _CC_PEAKS})


# ---------------------------------------------------------------------------
# Transcript
# ---------------------------------------------------------------------------

@router.get("/transcript/{video_id}")
@limiter.limit("120/minute")
async def cache_transcript(request: Request, video_id: str):
    """Return transcript JSON. Tries R2 first, falls back to local disk."""
    if CDN_ENABLED:
        from services.cdn_service import exists_in_cdn, stream_object, transcript_key

        key = transcript_key(video_id)
        if exists_in_cdn(video_id, "transcript"):
            logger.info("CDN hit: %s", key)
            return StreamingResponse(
                stream_object(key),
                media_type="application/json",
                headers={"Cache-Control": _CC_TRANSCRIPT},
            )
        logger.info("CDN miss for transcripts/%s, falling back to disk", video_id)

    # --- Local disk fallback ---
    data = load_transcript(video_id)
    if data is None:
        raise HTTPException(
            status_code=404,
            detail="Transcript not found. Run /local-api/transcribe first.",
        )
    return JSONResponse(content=data, headers={"Cache-Control": _CC_TRANSCRIPT})
