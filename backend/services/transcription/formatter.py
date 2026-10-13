from dataclasses import replace

from core.config import MIN_WORD_DURATION
from .types import TranscribedWord, TranscriptionResult

def format_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    m = int(seconds // 60)
    s = seconds % 60
    return f"{m:02d}:{s:05.2f}"

def normalize_word_timings(
    words: list[TranscribedWord],
    line_end: float,
    min_duration: float = MIN_WORD_DURATION,
) -> list[TranscribedWord]:
    """Widen implausibly short words by borrowing time from their neighbours.

    Aligners often collapse repeated words ("no, no, no") into a few 20ms
    frames. Runs of words shorter than ``min_duration`` are re-spaced inside
    the smallest window of adjacent words that can afford it. The window's
    outer boundaries, the line start and the line end never move, so only
    relative timing inside the line changes.
    """
    n = len(words)
    if n < 2 or min_duration <= 0:
        return words

    starts = [w.start for w in words]
    if any(b < a for a, b in zip(starts, starts[1:])):
        return words  # not monotonic: do not guess

    bound = max(line_end, starts[-1])
    ends = starts[1:] + [bound]
    dur = [e - s for s, e in zip(starts, ends)]
    eps = 1e-9

    out = list(words)
    i = 0
    while i < n:
        if dur[i] >= min_duration - eps:
            i += 1
            continue

        a = b = i
        while b + 1 < n and dur[b + 1] < min_duration - eps:
            b += 1

        # Grow forward, then backward, until the window can afford the minimum.
        while True:
            total = ends[b] - starts[a]
            count = b - a + 1
            if total >= count * min_duration - eps or (a == 0 and b == n - 1):
                break
            if b + 1 < n:
                b += 1
            elif a > 0:
                a -= 1

        total = ends[b] - starts[a]
        count = b - a + 1
        spare = [max(dur[k] - min_duration, 0.0) for k in range(a, b + 1)]
        if total >= count * min_duration - eps:
            extra = max(total - count * min_duration, 0.0)
            weight = sum(spare)
            new_dur = [
                min_duration
                + (extra * s / weight if weight > 0 else extra / count)
                for s in spare
            ]
        else:
            new_dur = [total / count] * count

        cursor = starts[a]
        for offset, k in enumerate(range(a, b + 1)):
            nxt = cursor + new_dur[offset]
            out[k] = replace(
                words[k],
                start=cursor,
                end=ends[b] if k == b else nxt,
            )
            cursor = nxt
        i = b + 1

    return out


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
        formatted_words = format_words(
            normalize_word_timings(seg.words, float(seg.end))
        )
        if formatted_words:
            synced.append(f"[{format_time(start)}]{formatted_words}")
        else:
            synced.append(f"[{format_time(start)}] {text}")
        plain.append(text)
    return "\n".join(synced), "\n".join(plain)
