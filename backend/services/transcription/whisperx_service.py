import logging
from pathlib import Path
from typing import Optional

from .base import BaseTranscriptionProvider
from .types import TranscriptionResult, TranscribedSegment, TranscribedWord
from . import lyrics_alignment as la

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

    def align_lyrics(self, audio_path: Path, lyrics: str) -> TranscriptionResult:
        """Use user-provided lyrics as the text and only take timing from audio.

        ASR gives coarse speech segments; the lyrics are matched onto them and
        then forced-aligned (wav2vec2) inside each segment window.
        """
        import torch
        import whisperx
        from services.lyrics_service import get_whisper_model, detect_primary_language, SUPPORTED_ALIGN_LANGS

        lines = la.split_lines(la.clean_lyrics(lyrics))
        if not lines:
            raise ValueError("Provided lyrics are empty.")

        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        model = get_whisper_model("small", device, compute_type)
        audio = whisperx.load_audio(str(audio_path))
        duration = len(audio) / 16000

        primary_lang = detect_primary_language(model, audio)
        asr_kwargs = {"batch_size": 4 if device == "cuda" else 1}
        if primary_lang:
            asr_kwargs["language"] = primary_lang
        asr = model.transcribe(audio, **asr_kwargs)
        language = asr.get("language", primary_lang)
        if language not in SUPPORTED_ALIGN_LANGS:
            raise ValueError(
                f"Lyrics alignment is not supported for language '{language}'."
            )

        asr_segments = [
            s for s in asr.get("segments", [])
            if (s.get("text") or "").strip() and s.get("start") is not None and s.get("end") is not None
        ]
        if not asr_segments:
            raise ValueError("No vocals detected to align the lyrics against.")

        tokens = la.tokenize_lyrics(lines, language)
        ranges = la.assign_lyrics_to_segments(
            [la.tokenize_text(s["text"], language) for s in asr_segments],
            [t.text for t in tokens],
        )

        model_a, metadata = whisperx.load_align_model(language_code=language, device=device)
        times: list = [(None, None)] * len(tokens)
        try:
            for seg, (lo, hi) in zip(asr_segments, ranges):
                if hi <= lo:
                    continue
                sep = "" if language in la.NO_SPACE_LANGS else " "
                text = sep.join(t.text for t in tokens[lo:hi])
                start = max(0.0, float(seg["start"]) - 0.3)
                end = min(duration, float(seg["end"]) + 0.3)
                try:
                    aligned = whisperx.align(
                        [{"text": text, "start": start, "end": end}],
                        model_a, metadata, audio, device,
                        return_char_alignments=False,
                    )
                except Exception as e:
                    logger.warning(f"Aligning lyrics window {start:.1f}-{end:.1f} failed: {e}")
                    continue
                words = aligned.get("word_segments", [])
                if len(words) != hi - lo:
                    logger.warning(
                        f"Word count mismatch ({len(words)} vs {hi - lo}) in window {start:.1f}-{end:.1f}; "
                        "using even spacing."
                    )
                    continue
                for k, w in enumerate(words):
                    times[lo + k] = (w.get("start"), w.get("end"))
        finally:
            del model_a
            if device == "cuda":
                torch.cuda.empty_cache()

        filled = la.fill_missing_times(times, 0.0, duration)
        segments = la.build_line_segments(lines, tokens, filled)
        logger.info(f"Aligned {len(segments)} user lyric lines (language={language}).")

        return TranscriptionResult(
            provider="whisperx-lyrics",
            language=language,
            segments=segments,
            plain_text="\n".join(lines),
            raw=None,
        )
