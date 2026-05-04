from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class TranscribedWord:
    word: str
    start: float
    end: float


@dataclass
class TranscribedSegment:
    text: str
    start: float
    end: float
    words: List[TranscribedWord] = field(default_factory=list)


@dataclass
class TranscriptionResult:
    provider: str
    language: Optional[str]
    segments: List[TranscribedSegment]
    plain_text: str
    raw: Optional[Dict[str, Any]] = None
