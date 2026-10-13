from abc import ABC, abstractmethod
from pathlib import Path
from .types import TranscriptionResult


class BaseTranscriptionProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_path: Path) -> TranscriptionResult:
        """
        Transcribe an audio file and return a standardized result.
        """
        raise NotImplementedError

    def align_lyrics(self, audio_path: Path, lyrics: str) -> TranscriptionResult:
        """
        Time user-provided lyrics against the audio. Optional capability.
        """
        raise NotImplementedError(
            f"{type(self).__name__} does not support aligning provided lyrics."
        )
