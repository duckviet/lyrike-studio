import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def normalize_video_id(raw_video_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]", "", raw_video_id.strip())

def load_json(path: Path) -> Optional[dict]:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))

def save_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
