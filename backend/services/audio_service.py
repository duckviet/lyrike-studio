import logging
import subprocess
import numpy as np
import yt_dlp
from pathlib import Path
from typing import Optional, List
from fastapi import HTTPException

from core.config import MEDIA_CACHE_DIR, AUDIO_CACHE_DIR, YOUTUBE_COOKIES_PATH, LOCAL_COOKIES_PATH
from core.utils import utc_now_iso

def _get_cookie_opt() -> dict:
    """Return cookiefile option if the file exists."""
    if YOUTUBE_COOKIES_PATH.exists():
        return {"cookiefile": str(YOUTUBE_COOKIES_PATH)}
    if LOCAL_COOKIES_PATH.exists():
        return {"cookiefile": str(LOCAL_COOKIES_PATH)}
    return {}

def find_cached_audio(video_id: str) -> Optional[Path]:
    audio_dir = AUDIO_CACHE_DIR / video_id
    if not audio_dir.exists():
        # Fallback to old flat structure if needed during migration period
        candidates = sorted(MEDIA_CACHE_DIR.glob(f"{video_id}.*"))
        for path in candidates:
            if path.suffix.lower() == ".json":
                continue
            if path.is_file():
                return path
        return None
        
    candidates = sorted(audio_dir.glob("original.*"))
    for path in candidates:
        if path.is_file():
            return path
    return None

def fetch_video_info(url: str) -> dict:
    ydl_opts = {
        "quiet": True, 
        "no_warnings": True, 
        "noplaylist": True, 
        "skip_download": True,
        "nocheckcertificate": True,
        # 'tv' and 'android' clients are currently the strongest against cloud IP blocks
        "extractor_args": {
            "youtube": {
                "player_client": ["tv", "android", "mweb", "web"],
                # Some videos now require 'web_creator' or 'web_embedded'
                "player_skip": ["web"] 
            }
        },
        "source_address": "0.0.0.0", # Force IPv4
        "check_formats": False,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebkit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.111 TV Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
        },
        **_get_cookie_opt(),
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            return ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as e:
        msg = str(e).lower()
        logging.error(f"yt-dlp fetch error: {e}")
        if "video unavailable" in msg or "private" in msg or "removed" in msg:
            raise HTTPException(status_code=404, detail="Video không tồn tại hoặc đã bị xóa")
        if "sign in" in msg or "bot" in msg or "captcha" in msg:
            raise HTTPException(
                status_code=403, 
                detail="YouTube đang chặn dải IP của server. Hãy thử cập nhật Cookies mới hoặc dùng video khác."
            )
        raise HTTPException(status_code=502, detail=f"Lỗi khi lấy thông tin video: {str(e)}")
    except Exception as e:
        logging.error(f"Unexpected fetch error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi server không xác định")

def download_audio(url: str, video_id: str) -> Path:
    target_dir = AUDIO_CACHE_DIR / video_id
    target_dir.mkdir(parents=True, exist_ok=True)
    
    outtmpl = str(target_dir / "original.%(ext)s")
    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "outtmpl": outtmpl,
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "extractor_args": {"youtube": {"player_client": ["tv", "android", "mweb"]}},
        "source_address": "0.0.0.0",
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebkit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.111 TV Safari/537.36",
        },
        **_get_cookie_opt(),
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        cached = find_cached_audio(video_id)
        if cached and cached.exists():
            return cached
        raise HTTPException(status_code=500, detail="Audio download completed but file not found")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"yt-dlp download error: {str(e)}")
        raise HTTPException(
            status_code=403,
            detail="Failed to download audio from YouTube. The server might be restricted."
        )

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
