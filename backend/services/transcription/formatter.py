from .types import TranscriptionResult

def format_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    m = int(seconds // 60)
    s = seconds % 60
    return f"{m:02d}:{s:05.2f}"

def build_synced_lyrics(result: TranscriptionResult) -> tuple[str, str]:
    synced = []
    plain = []
    for seg in result.segments:
        text = seg.text.strip()
        if text and seg.start is not None and seg.end is not None:
            synced.append(f"[{format_time(seg.start)}] {text}")
            plain.append(text)
    return "\n".join(synced), "\n".join(plain)

