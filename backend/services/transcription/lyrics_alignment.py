"""Helpers to align user-provided plain lyrics against ASR segments.

Pure logic only (no torch/whisperx) so it can be unit-tested cheaply.
"""
import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import List, Optional, Sequence, Tuple

from .types import TranscribedSegment, TranscribedWord

NO_SPACE_LANGS = {"ja", "zh", "japanese", "chinese"}
MAX_LYRICS_CHARS = 20000

_LRC_TIMESTAMP = re.compile(r"\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]|<\d{1,3}:\d{2}(?:[.:]\d{1,3})?>")
_LRC_META = re.compile(r"^\s*\[[a-zA-Z]+:[^\]]*\]\s*$")
_NON_WORD = re.compile(r"[\W_]+", re.UNICODE)


@dataclass
class LyricToken:
    text: str
    line_idx: int


def clean_lyrics(raw: str) -> str:
    """Strip LRC timestamps/metadata so pasted .lrc files also work."""
    lines = []
    for line in raw.replace("\r\n", "\n").split("\n"):
        if _LRC_META.match(line):
            continue
        lines.append(_LRC_TIMESTAMP.sub("", line).strip())
    return "\n".join(lines).strip()


def split_lines(lyrics: str) -> List[str]:
    return [" ".join(line.split()) for line in lyrics.split("\n") if line.strip()]


def tokenize_text(text: str, language: Optional[str]) -> List[str]:
    """Tokens must match how whisperx.align splits words for the language."""
    if (language or "").lower() in NO_SPACE_LANGS:
        return [c for c in text if not c.isspace()]
    return text.split()


def tokenize_lyrics(lines: Sequence[str], language: Optional[str]) -> List[LyricToken]:
    return [
        LyricToken(text=tok, line_idx=idx)
        for idx, line in enumerate(lines)
        for tok in tokenize_text(line, language)
    ]


def match_key(token: str) -> str:
    return _NON_WORD.sub("", token.lower())


def assign_lyrics_to_segments(
    segment_tokens: Sequence[Sequence[str]],
    lyric_tokens: Sequence[str],
) -> List[Tuple[int, int]]:
    """Map every ASR segment to a contiguous [start, end) range of lyric tokens.

    Ranges are monotonic and together cover all lyric tokens, so no user text
    is dropped even where ASR heard something very different.
    """
    n_seg = len(segment_tokens)
    n_lyr = len(lyric_tokens)
    if n_seg == 0:
        return []

    asr_keys: List[str] = []
    asr_seg_of: List[int] = []
    for si, toks in enumerate(segment_tokens):
        for tok in toks:
            asr_keys.append(match_key(tok) or f"\0a{len(asr_keys)}")
            asr_seg_of.append(si)
    lyr_keys = [match_key(t) or f"\0l{i}" for i, t in enumerate(lyric_tokens)]

    matcher = SequenceMatcher(a=asr_keys, b=lyr_keys, autojunk=False)
    # starts[si]: lyric index implied by the first matched token of segment si
    starts: List[Optional[int]] = [None] * n_seg
    seg_first_pos = {}
    pos = 0
    for si, toks in enumerate(segment_tokens):
        seg_first_pos[si] = pos
        pos += len(toks)

    for block in matcher.get_matching_blocks():
        for k in range(block.size):
            a_idx = block.a + k
            si = asr_seg_of[a_idx]
            if starts[si] is None:
                offset = a_idx - seg_first_pos[si]
                starts[si] = max(0, block.b + k - offset)

    resolved: List[int] = []
    prev = 0
    for si in range(n_seg):
        if starts[si] is None:
            # no anchor: assume this segment follows the previous one directly
            guess = prev + (len(segment_tokens[si - 1]) if si > 0 else 0)
            starts[si] = guess if si > 0 else 0
        cur = min(max(starts[si], prev), n_lyr)
        resolved.append(cur)
        prev = cur
    resolved[0] = 0  # lyrics before the first heard segment still belong to it

    return [
        (resolved[i], resolved[i + 1] if i + 1 < n_seg else n_lyr)
        for i in range(n_seg)
    ]


def fill_missing_times(
    times: Sequence[Tuple[Optional[float], Optional[float]]],
    lo: float,
    hi: float,
) -> List[Tuple[float, float]]:
    """Give every token a (start, end); unaligned ones are spread between neighbours."""
    n = len(times)
    out: List[Tuple[float, float]] = [(0.0, 0.0)] * n
    i = 0
    while i < n:
        s, e = times[i]
        if s is not None and e is not None:
            out[i] = (float(s), float(e))
            i += 1
            continue
        j = i
        while j < n and (times[j][0] is None or times[j][1] is None):
            j += 1
        left = out[i - 1][1] if i > 0 else lo
        right = float(times[j][0]) if j < n else hi
        right = max(right, left)
        step = (right - left) / (j - i)
        for k in range(i, j):
            out[k] = (left + step * (k - i), left + step * (k - i + 1))
        i = j
    return out


def build_line_segments(
    lines: Sequence[str],
    tokens: Sequence[LyricToken],
    token_times: Sequence[Tuple[float, float]],
) -> List[TranscribedSegment]:
    """Group per-token timings back into one segment per lyric line."""
    by_line: dict[int, List[TranscribedWord]] = {}
    for tok, (start, end) in zip(tokens, token_times):
        by_line.setdefault(tok.line_idx, []).append(
            TranscribedWord(word=tok.text, start=start, end=max(end, start))
        )

    segments: List[TranscribedSegment] = []
    for idx, line in enumerate(lines):
        words = by_line.get(idx)
        if not words:
            continue
        segments.append(
            TranscribedSegment(
                text=line,
                start=words[0].start,
                end=words[-1].end,
                words=words,
            )
        )
    return segments


def times_from_asr_words(
    lyric_tokens: Sequence[str],
    asr_words: Sequence[TranscribedWord],
    language: Optional[str],
) -> List[Tuple[Optional[float], Optional[float]]]:
    """Copy timings of ASR words onto the matching lyric tokens.

    Used for providers (OpenAI) that return word timestamps but expose no
    aligner: unmatched lyric tokens stay None and are interpolated later.
    """
    asr_keys: List[str] = []
    asr_times: List[Tuple[float, float]] = []
    for w in asr_words:
        pieces = tokenize_text(w.word, language)
        if not pieces:
            continue
        step = (w.end - w.start) / len(pieces)
        for i, piece in enumerate(pieces):
            asr_keys.append(match_key(piece) or f"\0a{len(asr_keys)}")
            asr_times.append((w.start + step * i, w.start + step * (i + 1)))
    lyr_keys = [match_key(t) or f"\0l{i}" for i, t in enumerate(lyric_tokens)]

    out: List[Tuple[Optional[float], Optional[float]]] = [(None, None)] * len(lyric_tokens)
    matcher = SequenceMatcher(a=asr_keys, b=lyr_keys, autojunk=False)
    for block in matcher.get_matching_blocks():
        for k in range(block.size):
            out[block.b + k] = asr_times[block.a + k]
    return out
