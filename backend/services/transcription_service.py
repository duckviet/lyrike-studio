from services.metadata_service import metadata_path
from services.metadata_service import save_peaks
from services.metadata_service import save_transcript
from services.metadata_service import transcript_path
import asyncio
import logging
import shutil
import tempfile
import threading
import traceback
from pathlib import Path
from typing import Dict, Optional, Set

from core.config import (
    ENABLE_LYRICS_REFINEMENT,
    MEDIA_CACHE_DIR,
    AUDIO_CACHE_DIR,
    OPENAI_API_KEY,
    PEAKS_CACHE_DIR, 
    TRANSCRIPTION_PROVIDER,
)
from core.utils import load_json, utc_now_iso
from services.audio_service import compute_peaks
from services.lyrics_refinement_service import refine_lyrics_with_ai
from services.lyrics_service import extract_vocals_demucs
from services.transcription.factory import get_transcription_provider
from services.transcription.formatter import build_synced_lyrics

logger = logging.getLogger("transcription_jobs")

JOB_LOCK = threading.Lock()
TRANSCRIBE_JOBS: Dict[str, Dict[str, str]] = {}
EVENT_QUEUES: Dict[str, Set[asyncio.Queue]] = {}
MAIN_LOOP: Optional[asyncio.AbstractEventLoop] = None


def set_main_loop(loop: asyncio.AbstractEventLoop) -> None:
    global MAIN_LOOP
    MAIN_LOOP = loop



def _broadcast(video_id: str, payload: dict) -> None:
    """Push event to all subscribed queues on the main event loop."""
    if not MAIN_LOOP:
        return
    for q in EVENT_QUEUES.get(video_id, set()):
        MAIN_LOOP.call_soon_threadsafe(q.put_nowait, {"videoId": video_id, **payload})


def _cache_demucs_peaks(video_id: str, vocals_path: Path) -> None:
    try:
        peaks = compute_peaks(vocals_path, samples=800)
        if not peaks:
            return
        save_peaks(video_id, "demucs", {
            "videoId": video_id,
            "samples": 800,
            "peaks": peaks,
            "source": "demucs",
            "generatedAt": utc_now_iso(),
        })
        logger.info(f"Saved demucs peaks for {video_id}")
    except Exception as e:
        logger.error(f"Failed to compute demucs peaks for {video_id}: {e}")


def process_audio(
    video_id: str,
    audio_path: str,
    use_demucs: bool = True,
    output_vocal_path: Optional[str] = None,
    provider_name: Optional[str] = None,
):
    """Run transcription on an audio file, optionally running Demucs first."""
    provider = get_transcription_provider(provider_name)

    if use_demucs:
        with tempfile.TemporaryDirectory() as tmpdir:
            vocals_path = extract_vocals_demucs(audio_path, tmpdir)
            _cache_demucs_peaks(video_id, Path(vocals_path))

            if output_vocal_path:
                shutil.copyfile(vocals_path, output_vocal_path)

            result = provider.transcribe(Path(vocals_path))
            synced, plain = build_synced_lyrics(result)
            return synced, plain, result

    result = provider.transcribe(Path(audio_path))
    synced, plain = build_synced_lyrics(result)
    return synced, plain, result


def run_transcription_job(
    video_id: str,
    audio_path: Path,
    use_demucs: bool = True,
    enable_refinement: bool = True,
    provider_name: Optional[str] = None,
) -> None:
    # OpenAI provider already works on mixed audio — skip Demucs
    actual_provider = (provider_name or TRANSCRIPTION_PROVIDER).lower()
    if "openai" in actual_provider:
        use_demucs = False
        logger.info(f"Skipping demucs for {video_id} (provider={actual_provider}).")

    status_data = {
        "status": "running",
        "startedAt": utc_now_iso(),
        "updatedAt": utc_now_iso(),
    }
    with JOB_LOCK:
        TRANSCRIBE_JOBS[video_id] = status_data
    _broadcast(video_id, status_data)

    try:
        metadata = load_json(metadata_path(video_id)) or {}
        # Define where to save the vocal file in cache
        vocal_cache_path = AUDIO_CACHE_DIR / video_id / "vocal.wav"
        vocal_cache_path.parent.mkdir(parents=True, exist_ok=True)

        synced_lyrics, plain_lyrics, result = process_audio(
            video_id, 
            str(audio_path), 
            use_demucs=use_demucs, 
            output_vocal_path=str(vocal_cache_path) if use_demucs else None,
            provider_name=provider_name
        )

        is_ai_refined = False
        model = None

        if enable_refinement and ENABLE_LYRICS_REFINEMENT and OPENAI_API_KEY:
            logger.info(f"[Refinement] Starting for {video_id}...")
            try:
                refined = asyncio.run(refine_lyrics_with_ai(
                    synced_lyrics,
                    plain_lyrics,
                    track_name=metadata.get("title", ""),
                    artist_name=metadata.get("uploader", ""),
                    duration=metadata.get("duration", 0),
                ))
                synced_lyrics = refined.get("syncedLyrics", synced_lyrics)
                plain_lyrics = refined.get("plainLyrics", plain_lyrics)
                is_ai_refined = refined.get("is_ai_refined", False)
                model = refined.get("model")
                logger.info(f"[Refinement] Done for {video_id} (model={model})")
            except Exception as e:
                logger.error(f"[Refinement] Failed for {video_id}: {e}")
        else:
            logger.info(
                f"[Refinement] Skipped for {video_id} "
                f"(enable={enable_refinement}, global={ENABLE_LYRICS_REFINEMENT}, "
                f"key={'set' if OPENAI_API_KEY else 'missing'})"
            )

        out_data = {
            "videoId": video_id,
            "status": "completed",
            "provider": result.provider if result else None,
            "language": result.language if result else None,
            "plain": plain_lyrics,
            "synced": synced_lyrics,
            "is_ai_refined": is_ai_refined,
            "model": model,
            "updatedAt": utc_now_iso(),
        }

        save_transcript(video_id, out_data)
        with JOB_LOCK:
            TRANSCRIBE_JOBS[video_id] = out_data
        _broadcast(video_id, out_data)

    except Exception as exc:
        traceback.print_exc()
        logger.exception(f"Transcription job failed for {video_id}: {exc}")
        error_status = {
            "status": "failed",
            "error": str(exc),
            "updatedAt": utc_now_iso(),
        }
        with JOB_LOCK:
            TRANSCRIBE_JOBS[video_id] = error_status
        _broadcast(video_id, error_status)