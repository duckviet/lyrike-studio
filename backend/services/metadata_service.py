"""
Local disk cache path helpers and CRUD operations.

Disk structure mirrors the R2 bucket layout in cdn_service.py:
  .cache/
  ├── audio/
  │   └── {video_id}/
  │       ├── original.m4a
  │       └── vocal.wav
  ├── peaks/
  │   └── {video_id}/
  │       ├── original.json
  │       └── demucs.json
  ├── transcripts/
  │   └── {video_id}.json
  └── media/
      └── {video_id}.json   ← video metadata (title, duration, …)
"""

from pathlib import Path
from typing import Optional

from core.config import MEDIA_CACHE_DIR, PEAKS_CACHE_DIR, TRANSCRIPT_CACHE_DIR
from core.utils import load_json, save_json, utc_now_iso


# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------

def metadata_path(video_id: str) -> Path:
    """JSON with video metadata (title, uploader, duration, …)."""
    return MEDIA_CACHE_DIR / f"{video_id}.json"


def peaks_path(video_id: str, source: str = "original") -> Path:
    """Peaks JSON at .cache/peaks/{video_id}/{source}.json"""
    d = PEAKS_CACHE_DIR / video_id
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{source}.json"


def transcript_path(video_id: str) -> Path:
    """Transcript JSON at .cache/transcripts/{video_id}.json"""
    return TRANSCRIPT_CACHE_DIR / f"{video_id}.json"


# ---------------------------------------------------------------------------
# Metadata (video info)
# ---------------------------------------------------------------------------

def load_metadata(video_id: str) -> Optional[dict]:
    return load_json(metadata_path(video_id))


def save_metadata(video_id: str, payload: dict) -> None:
    save_json(metadata_path(video_id), payload)


# ---------------------------------------------------------------------------
# Peaks
# ---------------------------------------------------------------------------

def load_peaks(video_id: str, source: str = "original") -> Optional[dict]:
    return load_json(peaks_path(video_id, source))


def save_peaks(video_id: str, source: str = "original", payload: Optional[dict] = None) -> None:
    if payload is None:
        return
    save_json(peaks_path(video_id, source), payload)


# ---------------------------------------------------------------------------
# Transcripts
# ---------------------------------------------------------------------------

def load_transcript(video_id: str) -> Optional[dict]:
    return load_json(transcript_path(video_id))


def save_transcript(video_id: str, payload: dict) -> None:
    save_json(transcript_path(video_id), payload)