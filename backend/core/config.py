import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load .env for local development
BASE_DIR = Path(__file__).parent.parent
env_path = BASE_DIR / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"[CONFIG] Loaded environment variables from {env_path}")
else:
    print(f"[CONFIG] No .env file found at {env_path}, using system environment variables")

# Cache root — always backend/.cache (absolute, CWD-independent)
# In Docker: /app/.cache  |  Local dev: /…/lrclib-upload/backend/.cache
CACHE_ROOT = BASE_DIR / ".cache"
MEDIA_CACHE_DIR = CACHE_ROOT / "media"        # {video_id}.json + audio files
AUDIO_CACHE_DIR = CACHE_ROOT / "audio"        # audio/{video_id}/original.m4a …
TRANSCRIPT_CACHE_DIR = CACHE_ROOT / "transcripts"  # {video_id}.json
PEAKS_CACHE_DIR = CACHE_ROOT / "peaks"        # {video_id}/{source}.json

for d in [MEDIA_CACHE_DIR, AUDIO_CACHE_DIR, TRANSCRIPT_CACHE_DIR, PEAKS_CACHE_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# --- OpenAI ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ENABLE_LYRICS_REFINEMENT = os.getenv("ENABLE_LYRICS_REFINEMENT", "false").lower() in ("true", "1", "yes")
TRANSCRIPTION_PROVIDER = os.getenv("TRANSCRIPTION_PROVIDER", "openai-whisper")
OPENAI_TRANSCRIPTION_MODEL = os.getenv("OPENAI_TRANSCRIPTION_MODEL", "whisper-1")

if not OPENAI_API_KEY:
    print("[CONFIG] WARNING: OPENAI_API_KEY is missing!")

# --- CORS / Frontend ---
FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip()

def get_allowed_origins() -> List[str]:
    """Build CORS allowed origins list. Always includes localhost for dev."""
    origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
    ]
    if FRONTEND_URL:
        # Support comma-separated list e.g. "https://app.example.com,https://www.example.com"
        for url in FRONTEND_URL.split(","):
            url = url.strip().rstrip("/")
            if url and url not in origins:
                origins.append(url)
    return origins

ALLOWED_ORIGINS = get_allowed_origins()

# --- CDN (Cloudflare R2 / S3-compatible) ---
CDN_ACCOUNT_ID = os.getenv("CDN_ACCOUNT_ID", "")
CDN_ACCESS_KEY_ID = os.getenv("CDN_ACCESS_KEY_ID", "")
CDN_SECRET_ACCESS_KEY = os.getenv("CDN_SECRET_ACCESS_KEY", "")
CDN_REGION = os.getenv("CDN_REGION", "auto")
CDN_BUCKET_NAME = os.getenv("CDN_BUCKET_NAME", "")
CDN_PUBLIC_BASE_URL = os.getenv("CDN_PUBLIC_BASE_URL", "").strip().rstrip("/")

CDN_ENABLED = bool(CDN_ACCOUNT_ID and CDN_ACCESS_KEY_ID and CDN_SECRET_ACCESS_KEY and CDN_BUCKET_NAME)

# --- Rate Limiting ---
# Requests per minute per IP. Set via env to tune per environment.
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
# Stricter limit for expensive transcription endpoint
RATE_LIMIT_TRANSCRIBE_PER_MINUTE = int(os.getenv("RATE_LIMIT_TRANSCRIBE_PER_MINUTE", "5"))
# --- YouTube Blocking Workaround ---
YOUTUBE_COOKIES_PATH = Path("/tmp/yt_cookies.txt")

def write_cookies_from_env():
    """Write cookies from YOUTUBE_COOKIES env var to a temporary file for yt-dlp."""
    import os
    import base64
    cookie_content = os.getenv("YOUTUBE_COOKIES", "").strip()
    if cookie_content:
        try:
            # Check if it's base64 encoded
            # Base64 strings of Netscape cookies usually start with 'IyBOZXRzY2FwZ' ('# Netscape')
            if not cookie_content.startswith("#") and len(cookie_content) > 20:
                try:
                    decoded = base64.b64decode(cookie_content).decode("utf-8")
                    cookie_content = decoded
                except Exception:
                    # Not base64 or failed to decode, keep original
                    pass
            
            YOUTUBE_COOKIES_PATH.write_text(cookie_content, encoding="utf-8")
            print(f"[CONFIG] YouTube cookies written to {YOUTUBE_COOKIES_PATH}")
            return True
        except Exception as e:
            print(f"[CONFIG] Error writing YouTube cookies: {e}")
    return False
