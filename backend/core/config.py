from pathlib import Path

CACHE_ROOT = Path(".cache")
MEDIA_CACHE_DIR = CACHE_ROOT / "media"
TRANSCRIPT_CACHE_DIR = CACHE_ROOT / "transcripts"
PEAKS_CACHE_DIR = CACHE_ROOT / "peaks"

# Ensure directories exist
for d in [MEDIA_CACHE_DIR, TRANSCRIPT_CACHE_DIR, PEAKS_CACHE_DIR]:
    d.mkdir(parents=True, exist_ok=True)
