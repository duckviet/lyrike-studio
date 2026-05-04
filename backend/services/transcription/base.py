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
