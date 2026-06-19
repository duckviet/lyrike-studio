from .types import TranscribedWord, TranscriptionResult

def format_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    m = int(seconds // 60)
    s = seconds % 60
    return f"{m:02d}:{s:05.2f}"

def format_words(words: list[TranscribedWord]) -> str:
    formatted_words = [
        f"<{format_time(word.start)}>{text}"
        for word in words
        if (text := word.word.strip())
    ]
    return " ".join(formatted_words)

def build_synced_lyrics(result: TranscriptionResult) -> tuple[str, str]:
    synced: list[str] = []
    plain: list[str] = []
    for seg in result.segments:
        text = seg.text.strip()
        if not text:
            continue
        try:
            start = float(seg.start)
            _ = float(seg.end)
        except (TypeError, ValueError):
            continue
        formatted_words = format_words(seg.words)
        if formatted_words:
            synced.append(f"[{format_time(start)}]{formatted_words}")
        else:
            synced.append(f"[{format_time(start)}] {text}")
        plain.append(text)
    return "\n".join(synced), "\n".join(plain)
