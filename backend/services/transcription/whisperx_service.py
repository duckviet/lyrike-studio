import logging
from pathlib import Path
from typing import Optional

from .base import BaseTranscriptionProvider
from .types import TranscriptionResult, TranscribedSegment, TranscribedWord

logger = logging.getLogger("whisperx_service")
logger.setLevel(logging.INFO)

class WhisperXTranscriptionProvider(BaseTranscriptionProvider):
    def transcribe(self, audio_path: Path) -> TranscriptionResult:
        # Import whisperx-related code locally to avoid loading torch/whisperx globally
        # when other providers are used.
        import torch
        import whisperx
        from services.lyrics_service import get_whisper_model, detect_primary_language, SUPPORTED_ALIGN_LANGS

        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        model = get_whisper_model("small", device, compute_type)

        logger.info("Loading audio for WhisperX transcription...")
        audio = whisperx.load_audio(str(audio_path))

        primary_lang = detect_primary_language(model, audio)

        logger.info(f"Starting WhisperX transcription (language={primary_lang or 'auto'})...")
        transcribe_kwargs = {
            "batch_size": 4 if device == "cuda" else 1,
        }

        if primary_lang:
            transcribe_kwargs["language"] = primary_lang

        result = model.transcribe(audio, **transcribe_kwargs)
        detected_lang = result.get("language", primary_lang)
        logger.info(f"Transcription done. Language: {detected_lang}")

        if detected_lang in SUPPORTED_ALIGN_LANGS:
            try:
                model_a, metadata = whisperx.load_align_model(
                    language_code=detected_lang, device=device
                )
                result = whisperx.align(
                    result["segments"], model_a, metadata,
                    audio, device, return_char_alignments=False
                )
                logger.info("Word alignment complete.")

                del model_a
                if device == "cuda":
                    torch.cuda.empty_cache()
            except Exception as e:
                logger.warning(f"Alignment failed: {e}. Using segment-level timing.")
        else:
            logger.info(f"Language '{detected_lang}' not supported for alignment. Skipping.")

        # Map result to standard formats
        segments = []
        for seg in result.get("segments", []):
            text = (seg.get("text") or "").strip()
            start = seg.get("start")
            end = seg.get("end")
            
            if text and start is not None and end is not None:
                words = []
                for w in seg.get("words", []):
                    word_str = (w.get("word") or "").strip()
                    w_start = w.get("start")
                    w_end = w.get("end")
                    if word_str and w_start is not None and w_end is not None:
                        words.append(TranscribedWord(
                            word=word_str,
                            start=float(w_start),
                            end=float(w_end)
                        ))
                
                segments.append(TranscribedSegment(
                    text=text,
                    start=float(start),
                    end=float(end),
                    words=words
                ))

        # Plain text representation
        plain_text = "\n".join(seg.text for seg in segments).strip()

        return TranscriptionResult(
            provider="whisperx",
            language=detected_lang,
            segments=segments,
            plain_text=plain_text,
            raw=result
        )