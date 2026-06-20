import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def normalize_video_id(raw_video_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]", "", raw_video_id.strip())

def sanitize_youtube_url(url: str) -> str:
    if not url or not isinstance(url, str):
        return url
    url = url.strip()
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname.lower() if parsed.hostname else ""
        if "youtube.com" in hostname or "youtu.be" in hostname:
            query_params = parse_qsl(parsed.query, keep_blank_values=True)
            filtered_params = [
                (k, v) for k, v in query_params
                if k.lower() not in ("list", "index")
            ]
            new_query = urlencode(filtered_params)
            parsed = parsed._replace(query=new_query)
            return urlunparse(parsed)
    except Exception:
        pass
    return url

def load_json(path: Path) -> Optional[dict]:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))

def save_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

