from core.config import TRANSCRIPTION_PROVIDER
from .base import BaseTranscriptionProvider

def get_transcription_provider(provider_name: str | None = None) -> BaseTranscriptionProvider:
    """
    Returns an instance of BaseTranscriptionProvider depending on the
    provider_name passed in or falls back to TRANSCRIPTION_PROVIDER from config.
    """
    provider = (provider_name or TRANSCRIPTION_PROVIDER).lower()

    if provider == "whisperx":
        from .whisperx_service import WhisperXTranscriptionProvider
        return WhisperXTranscriptionProvider()
    elif provider == "openai-whisper-1":
        from .openai_whisper_service import OpenAIWhisperTranscriptionProvider
        return OpenAIWhisperTranscriptionProvider()
    else:
        raise ValueError(f"Unsupported transcription provider: {provider}")