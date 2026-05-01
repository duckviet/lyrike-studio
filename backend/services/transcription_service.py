import asyncio
import threading
import logging
import tempfile
import shutil
import os
from pathlib import Path
from typing import Dict, Set, Optional

from core.config import TRANSCRIPT_CACHE_DIR, PEAKS_CACHE_DIR
from core.utils import utc_now_iso, save_json
from services.lyrics_service import run_whisper_on_audio, extract_vocals_demucs
from services.audio_service import compute_peaks

JOB_LOCK = threading.Lock()
TRANSCRIBE_JOBS: Dict[str, Dict[str, str]] = {}
EVENT_QUEUES: Dict[str, Set[asyncio.Queue]] = {}
MAIN_LOOP: Optional[asyncio.AbstractEventLoop] = None

def set_main_loop(loop: asyncio.AbstractEventLoop):
    global MAIN_LOOP
    MAIN_LOOP = loop

def transcript_path(video_id: str) -> Path:
    return TRANSCRIPT_CACHE_DIR / f"{video_id}.json"

def process_audio(video_id: str, audio_path: str, use_demucs: bool = True, output_vocal_path: Optional[str] = None):
    """
    Wrapper for transcription logic, optionally using Demucs.
    """
    if use_demucs:
        with tempfile.TemporaryDirectory() as tmpdir:
            vocals_path = extract_vocals_demucs(audio_path, tmpdir)
            
            # Compute peaks for the vocals file
            try:
                peaks = compute_peaks(Path(vocals_path), samples=800)
                if peaks:
                    peaks_payload = {
                        "videoId": video_id,
                        "samples": 800,
                        "peaks": peaks,
                        "source": "demucs",
                        "generatedAt": utc_now_iso()
                    }
                    peaks_cache_path = PEAKS_CACHE_DIR / f"{video_id}_demucs.json"
                    save_json(peaks_cache_path, peaks_payload)
                    logging.info(f"Saved demucs peaks for {video_id}")
            except Exception as e:
                logging.error(f"Failed to compute demucs peaks for {video_id}: {e}")

            if output_vocal_path:
                shutil.copyfile(vocals_path, output_vocal_path)
            return run_whisper_on_audio(vocals_path)
    return run_whisper_on_audio(audio_path)

def run_transcription_job(video_id: str, audio_path: Path, use_demucs: bool = True) -> None:
    status_data = {"status": "running", "startedAt": utc_now_iso(), "updatedAt": utc_now_iso()}
    with JOB_LOCK:
        TRANSCRIBE_JOBS[video_id] = status_data
    
    if MAIN_LOOP:
        for q in EVENT_QUEUES.get(video_id, set()):
            MAIN_LOOP.call_soon_threadsafe(q.put_nowait, {"videoId": video_id, **status_data})
    
    try:
        synced_lyrics, plain_lyrics = process_audio(video_id, str(audio_path), use_demucs=use_demucs)
        
        payload = {
            "videoId": video_id,
            "syncedLyrics": synced_lyrics,
            "plainLyrics": plain_lyrics,
            "updatedAt": utc_now_iso()
        }
        save_json(transcript_path(video_id), payload)
        
        final_status = {
            "status": "completed",
            "synced": synced_lyrics,
            "plain": plain_lyrics,
            "updatedAt": utc_now_iso()
        }
        with JOB_LOCK:
            TRANSCRIBE_JOBS[video_id] = final_status
            
        if MAIN_LOOP:
            for q in EVENT_QUEUES.get(video_id, set()):
                MAIN_LOOP.call_soon_threadsafe(q.put_nowait, {"videoId": video_id, **final_status})
                
    except Exception as exc:
        logging.exception(f"Transcription job failed for {video_id}: {exc}")
        error_status = {"status": "failed", "error": str(exc), "updatedAt": utc_now_iso()}
        with JOB_LOCK:
            TRANSCRIBE_JOBS[video_id] = error_status
        if MAIN_LOOP:
            for q in EVENT_QUEUES.get(video_id, set()):
                MAIN_LOOP.call_soon_threadsafe(q.put_nowait, {"videoId": video_id, **error_status})
