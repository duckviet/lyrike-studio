import logging
from pathlib import Path
from typing import Optional

from openai import OpenAI

from core.config import OPENAI_API_KEY, OPENAI_TRANSCRIPTION_MODEL
from .base import BaseTranscriptionProvider
from .types import TranscriptionResult, TranscribedSegment, TranscribedWord

logger = logging.getLogger("openai_whisper_service")
logger.setLevel(logging.INFO)

class OpenAIWhisperTranscriptionProvider(BaseTranscriptionProvider):
    def __init__(self):
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured.")
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.model = OPENAI_TRANSCRIPTION_MODEL

    def transcribe(self, audio_path: Path) -> TranscriptionResult:
        logger.info(f"Starting OpenAI transcription using model={self.model} for {audio_path}")
        
        with open(audio_path, "rb") as f:
            response = self.client.audio.transcriptions.create(
                model=self.model,
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["word", "segment"],
            )

        segments = []
        resp_segments = getattr(response, "segments", None) or []
        resp_words = getattr(response, "words", None) or []
        
        # In whisper-1 verbose_json, words are global, usually we map them to segments.
        # For simplicity, we just keep segment text/start/end and empty words array initially,
        # but if we want to perfectly map them, we can distribute global words to their respective segments.
        
        # Word mapping to segments (optional but good for completeness):
        # We can iterate segments and grab words that fall in segment timeframe.
        word_idx = 0
        for seg in resp_segments:
            seg_start = float(seg.start)
            seg_end = float(seg.end)
            seg_words = []
            
            while word_idx < len(resp_words):
                w = resp_words[word_idx]
                w_start = float(w.start)
                w_end = float(w.end)
                
                # If word is before the segment starts, skip it (should not happen)
                if w_end <= seg_start:
                    word_idx += 1
                    continue
                # If word starts after segment ends, break for next segment
                if w_start >= seg_end:
                    break
                
                # Belongs to this segment
                seg_words.append(TranscribedWord(
                    word=(w.word or "").strip(),
                    start=w_start,
                    end=w_end
                ))
                word_idx += 1
            
            segments.append(TranscribedSegment(
                text=seg.text.strip(),
                start=seg_start,
                end=seg_end,
                words=seg_words
            ))

        return TranscriptionResult(
            provider=f"openai-{self.model}",
            language=getattr(response, "language", None),
            segments=segments,
            plain_text=getattr(response, "text", "").strip(),
            raw=response.model_dump() if hasattr(response, "model_dump") else getattr(response, "dict", lambda: None)()
        )