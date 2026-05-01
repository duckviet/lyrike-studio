# extract_lyrics.py (backend copy, refactored to avoid persisting vocals)
import sys
import json
import os
import subprocess
import tempfile
import logging
import warnings
import shutil
from pathlib import Path
import yt_dlp
import whisperx
import torch
import numpy as np

try:
    from core.config import PEAKS_CACHE_DIR
    from core.utils import utc_now_iso, save_json, normalize_video_id
    from services.audio_service import compute_peaks
except ImportError:
    # Fallback or dummy if run as standalone and services aren't available
    PEAKS_CACHE_DIR = None
    def compute_peaks(*args, **kwargs): return []
    def utc_now_iso(): return ""
    def save_json(*args, **kwargs): pass
    def normalize_video_id(v): return v

warnings.filterwarnings("ignore")

MAX_DURATION = 5
MAX_WORDS = 12

vad_opts = {
    "vad_onset": 0.500,
    "vad_offset": 0.363,
}

logger = logging.getLogger("lyrics_extractor")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%H:%M:%S'))
if not logger.handlers:
    logger.addHandler(ch)


def format_time_lrc(seconds):
    m = int(seconds // 60)
    s = seconds % 60
    return f"[{m:02d}:{s:05.2f}]"


def extract_vocals_demucs(audio_path, output_dir):
    logger.info(f"Running Demucs on {audio_path}...")
    cmd = [
        sys.executable, "-m", "demucs.separate",
        "--two-stems=vocals",
        "-n", "htdemucs",
        "-o", output_dir,
        audio_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        stderr = e.stderr.decode() if e.stderr else "Unknown error"
        logger.error(f"Demucs failed: {stderr}")
        raise RuntimeError(f"Demucs processing failed: {stderr}")

    audio_basename = os.path.splitext(os.path.basename(audio_path))[0]
    vocals_path = os.path.join(output_dir, "htdemucs", audio_basename, "vocals.wav")
    if os.path.exists(vocals_path):
        logger.info(f"Demucs vocals at: {vocals_path}")
        return vocals_path
    raise FileNotFoundError(f"Demucs did not output expected vocals file: {vocals_path}")


_CACHED_MODELS = {}


def get_whisper_model(model_name="small", device=None, compute_type=None):
    global _CACHED_MODELS
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    if compute_type is None:
        compute_type = "float16" if device == "cuda" else "int8"

    key = (model_name, device, compute_type)
    if key not in _CACHED_MODELS:
        logger.info(f"Loading WhisperX model '{model_name}' (Device: {device})...")
        _CACHED_MODELS[key] = whisperx.load_model(model_name, device, compute_type=compute_type, vad_options=vad_opts)
    return _CACHED_MODELS[key]


def _run_whisper_on_audio(audio_path):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"
    model = get_whisper_model("small", device, compute_type)

    logger.info("Starting transcription...")
    audio = whisperx.load_audio(audio_path)
    result = model.transcribe(audio, batch_size=4 if device == "cuda" else 1)

    try:
        model_a, metadata = whisperx.load_align_model(language_code=result["language"], device=device)
        result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)
        logger.info("Word alignment complete.")
    except Exception as e:
        logger.warning(f"Alignment failed: {e}. Falling back to segments.")

    # regroup words into lines
    lines = []
    for seg in result.get("segments", []):
        t = seg.get("text", "").strip()
        if t:
            lines.append((seg.get("start", 0), t))

    synced = [f"{format_time_lrc(start)} {text}" for start, text in lines]
    plain = [text for _, text in lines]
    return "\n".join(synced), "\n".join(plain)


def run_extraction(url: str):
    # This helper still supports a quick extraction flow (downloads audio, runs demucs+whisper)
    with tempfile.TemporaryDirectory() as tmpdir:
        out_audio = os.path.join(tmpdir, "audio.wav")
        # download audio as wav temporarily
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': out_audio,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
                'preferredquality': '192',
            }],
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
        vocals = extract_vocals_demucs(out_audio, tmpdir)
        
        # Calculate peaks for demucs
        if PEAKS_CACHE_DIR:
            video_id = normalize_video_id(info.get('id', ''))
            try:
                peaks = compute_peaks(Path(vocals), samples=800)
                if peaks:
                    payload = {
                        "videoId": video_id,
                        "samples": 800,
                        "peaks": peaks,
                        "source": "demucs",
                        "generatedAt": utc_now_iso()
                    }
                    save_json(PEAKS_CACHE_DIR / f"{video_id}_demucs.json", payload)
                    logger.info(f"Cached demucs peaks for {video_id}")
            except Exception as e:
                logger.error(f"Failed to cache peaks in run_extraction: {e}")

        synced, plain = _run_whisper_on_audio(vocals)
        return {"trackName": info.get('title', ''), "artistName": info.get('uploader', ''), "duration": info.get('duration', 0), "syncedLyrics": synced, "plainLyrics": plain}


if __name__ == "__main__":
    print("This module is intended to be imported by the backend service")
