import logging
from pathlib import Path
from typing import Optional

from openai import OpenAI

from core.config import OPENAI_API_KEY, OPENAI_TRANSCRIPTION_MODEL
from .base import BaseTranscriptionProvider
from . import lyrics_alignment as la
from .types import TranscriptionResult, TranscribedSegment, TranscribedWord

logger = logging.getLogger("openai_whisper_service")
logger.setLevel(logging.INFO)

class OpenAIWhisperTranscriptionProvider(BaseTranscriptionProvider):
    def __init__(self):
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured.")
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.model = OPENAI_TRANSCRIPTION_MODEL

    def align_lyrics(self, audio_path: Path, lyrics: str) -> TranscriptionResult:
        """Transcribe with the lyrics as a prompt, then map user text onto ASR timings."""
        lines = la.split_lines(la.clean_lyrics(lyrics))
        if not lines:
            raise ValueError("Provided lyrics are empty.")

        # Whisper only reads the last ~224 prompt tokens; a leading excerpt biases spelling/vocab.
        prompt = " ".join(lines)[:600]
        result = self.transcribe(audio_path, prompt=prompt)

        asr_words = [w for seg in result.segments for w in seg.words]
        if not asr_words:
            raise ValueError("No vocals detected to align the lyrics against.")

        tokens = la.tokenize_lyrics(lines, result.language)
        times = la.times_from_asr_words([t.text for t in tokens], asr_words, result.language)
        duration = max(w.end for w in asr_words)
        filled = la.fill_missing_times(times, 0.0, duration)
        segments = la.build_line_segments(lines, tokens, filled)
        matched = sum(1 for t in times if t[0] is not None)
        logger.info(f"Mapped lyrics onto OpenAI timings: {matched}/{len(tokens)} tokens matched.")

        return TranscriptionResult(
            provider=f"openai-{self.model}-lyrics",
            language=result.language,
            segments=segments,
            plain_text="\n".join(lines),
            raw=None,
        )

    def transcribe(self, audio_path: Path, prompt: Optional[str] = None) -> TranscriptionResult:
        logger.info(f"Starting OpenAI transcription using model={self.model} for {audio_path}")
        
        extra = {"prompt": prompt} if prompt else {}
        with open(audio_path, "rb") as f:
            response = self.client.audio.transcriptions.create(
                model=self.model,
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["word", "segment"],
                **extra,
            )

        # Save to log file to check
        # try:
        #     import json
        #     log_dir = Path(__file__).parent.parent.parent / "logs"
        #     log_dir.mkdir(exist_ok=True)
        #     log_path = log_dir / "openai_whisper_response.json"
        #     with open(log_path, "w", encoding="utf-8") as lf:
        #         try:
        #             lf.write(response.model_dump_json(indent=2))
        #         except AttributeError:
        #             try:
        #                 lf.write(json.dumps(response.dict(), indent=2, ensure_ascii=False))
        #             except AttributeError:
        #                 lf.write(str(response))
        #     logger.info(f"Saved OpenAI whisper response to {log_path}")
        # except Exception as e:
        #     logger.error(f"Failed to save OpenAI whisper response log: {e}")

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