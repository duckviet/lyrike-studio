"""
CDN Service — Cloudflare R2 (S3-compatible) upload & key management.

Bucket path structure
─────────────────────
  audio/{video_id}/original.m4a      ← original downloaded audio
  audio/{video_id}/vocal.wav         ← demucs-separated vocals (optional)
  peaks/{video_id}/original.json     ← waveform peaks for original
  peaks/{video_id}/demucs.json       ← waveform peaks for demucs vocals
  transcripts/{video_id}.json        ← final transcript / synced lyrics

All objects are private by default; access is via the /cache/* proxy routes
which can add auth, caching headers, and per-resource logic.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Literal, Optional

logger = logging.getLogger("cdn_service")

AudioSource = Literal["original", "vocal"]
PeaksSource = Literal["original", "demucs"]

# ---------------------------------------------------------------------------
# R2 key helpers  (pure functions — no I/O, easy to unit-test)
# ---------------------------------------------------------------------------

def audio_key(video_id: str, source: AudioSource = "original", ext: str = "m4a") -> str:
    """s3 key for an audio file."""
    filename = f"{source}.{ext}"
    return f"audio/{video_id}/{filename}"


def peaks_key(video_id: str, source: PeaksSource = "original") -> str:
    """s3 key for a peaks JSON file."""
    return f"peaks/{video_id}/{source}.json"


def transcript_key(video_id: str) -> str:
    """s3 key for a transcript JSON file."""
    return f"transcripts/{video_id}.json"


def public_url(base_url: str, key: str) -> str:
    """Build the full public URL for a key when using a public R2 bucket or Worker."""
    return f"{base_url.rstrip('/')}/{key}"


# ---------------------------------------------------------------------------
# S3 client (lazy singleton — only created when CDN is enabled)
# ---------------------------------------------------------------------------

_s3_client = None


def _get_client():
    global _s3_client
    if _s3_client is not None:
        return _s3_client

    import boto3
    from core.config import (
        CDN_ACCESS_KEY_ID,
        CDN_ACCOUNT_ID,
        CDN_REGION,
        CDN_SECRET_ACCESS_KEY,
    )

    endpoint = f"https://{CDN_ACCOUNT_ID}.r2.cloudflarestorage.com"
    _s3_client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=CDN_ACCESS_KEY_ID,
        aws_secret_access_key=CDN_SECRET_ACCESS_KEY,
        region_name=CDN_REGION or "auto",
    )
    return _s3_client


# ---------------------------------------------------------------------------
# Upload helpers
# ---------------------------------------------------------------------------

def _upload(key: str, body: bytes, content_type: str) -> bool:
    from core.config import CDN_BUCKET_NAME

    try:
        _get_client().put_object(
            Bucket=CDN_BUCKET_NAME,
            Key=key,
            Body=body,
            ContentType=content_type,
        )
        logger.info("CDN upload OK: %s", key)
        return True
    except Exception as exc:
        logger.error("CDN upload FAILED for %s: %s", key, exc)
        return False


def upload_audio(video_id: str, file_path: Path, source: AudioSource = "original") -> Optional[str]:
    """Upload an audio file to R2. Returns the R2 key on success, None on failure."""
    ext = file_path.suffix.lstrip(".") or "m4a"
    key = audio_key(video_id, source, ext)
    content_type = "audio/mp4" if ext == "m4a" else "audio/wav"
    success = _upload(key, file_path.read_bytes(), content_type)
    return key if success else None


def upload_peaks(video_id: str, payload: dict, source: PeaksSource = "original") -> Optional[str]:
    """Upload a peaks JSON to R2. Returns the R2 key on success, None on failure."""
    key = peaks_key(video_id, source)
    success = _upload(key, json.dumps(payload).encode(), "application/json")
    return key if success else None


def upload_transcript(video_id: str, payload: dict) -> Optional[str]:
    """Upload a transcript JSON to R2. Returns the R2 key on success, None on failure."""
    key = transcript_key(video_id)
    success = _upload(key, json.dumps(payload).encode(), "application/json")
    return key if success else None


# ---------------------------------------------------------------------------
# Existence check (HEAD request — avoids transferring data)
# ---------------------------------------------------------------------------

def exists_in_cdn(video_id: str, resource: Literal["audio", "peaks", "transcript"],
                  source: str = "original") -> bool:
    from core.config import CDN_BUCKET_NAME

    if resource == "audio":
        key = audio_key(video_id, source)  # type: ignore[arg-type]
    elif resource == "peaks":
        key = peaks_key(video_id, source)  # type: ignore[arg-type]
    else:
        key = transcript_key(video_id)

    try:
        _get_client().head_object(Bucket=CDN_BUCKET_NAME, Key=key)
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Presigned URL (for private buckets — valid for 1 hour by default)
# ---------------------------------------------------------------------------

def presigned_url(key: str, expires: int = 3600) -> Optional[str]:
    from core.config import CDN_BUCKET_NAME

    try:
        return _get_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": CDN_BUCKET_NAME, "Key": key},
            ExpiresIn=expires,
        )
    except Exception as exc:
        logger.error("Failed to generate presigned URL for %s: %s", key, exc)
        return None


# ---------------------------------------------------------------------------
# Stream object bytes (used by the cache proxy route)
# ---------------------------------------------------------------------------

def stream_object(key: str):
    """Generator that yields chunks from an R2 object. Raises if not found."""
    from core.config import CDN_BUCKET_NAME

    response = _get_client().get_object(Bucket=CDN_BUCKET_NAME, Key=key)
    body = response["Body"]
    chunk_size = 64 * 1024  # 64 KB
    while True:
        chunk = body.read(chunk_size)
        if not chunk:
            break
        yield chunk
