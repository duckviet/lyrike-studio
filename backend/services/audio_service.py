import logging
import subprocess
import numpy as np
import yt_dlp
from pathlib import Path
from typing import Optional, List
from fastapi import HTTPException

from core.config import MEDIA_CACHE_DIR
from core.utils import utc_now_iso

def find_cached_audio(video_id: str) -> Optional[Path]:
    candidates = sorted(MEDIA_CACHE_DIR.glob(f"{video_id}.*"))
    for path in candidates:
        if path.suffix.lower() == ".json":
            continue
        if path.is_file():
            return path
    return None

def fetch_video_info(url: str) -> dict:
    ydl_opts = {"quiet": True, "no_warnings": True, "noplaylist": True, "skip_download": True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        return ydl.extract_info(url, download=False)

def download_audio(url: str, video_id: str) -> Path:
    outtmpl = str(MEDIA_CACHE_DIR / f"{video_id}.%(ext)s")
    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "outtmpl": outtmpl,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True
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
    import re
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

def compute_peaks(audio_path: Path, samples: int) -> List[float]:
    target_ar = max(1000, (samples * 10) // 60)
    cmd = [
        "ffmpeg", "-i", str(audio_path), "-f", "f32le", "-acodec", "pcm_f32le",
        "-ac", "1", "-ar", str(target_ar), "-loglevel", "error", "-"
    ]
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, _ = process.communicate()
        if process.returncode != 0:
            return []
        data = np.frombuffer(out, dtype=np.float32)
        if len(data) == 0:
            return []
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
        max_peak = max(peaks) if peaks else 0
        if max_peak > 1.0:
            peaks = [round(p / max_peak, 4) for p in peaks]
        return peaks
    except Exception as exc:
        logging.error(f"Peak computation failed: {exc}")
        return []
