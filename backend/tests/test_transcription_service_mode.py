import unittest

from services.transcription.formatter import build_synced_lyrics
from services.transcription.types import (
    TranscribedSegment,
    TranscribedWord,
    TranscriptionResult,
)
from services.transcription_service import _strip_words


class TestTranscriptionModeStrip(unittest.TestCase):
    def test_strip_words_removes_word_timings(self) -> None:
        # Given: a transcription result with word-level timings.
        result = TranscriptionResult(
            provider="test",
            language="en",
            segments=[
                TranscribedSegment(
                    text="Hello world",
                    start=1.0,
                    end=2.0,
                    words=[
                        TranscribedWord(word="Hello", start=1.1, end=1.4),
                        TranscribedWord(word="world", start=1.5, end=1.9),
                    ],
                )
            ],
            plain_text="Hello world",
        )

        # When: word timings are stripped and lyrics are formatted.
        stripped = _strip_words(result)
        synced, plain = build_synced_lyrics(stripped)

        # Then: the synced output is line-only LRC and plain text is preserved.
        self.assertEqual(synced, "[00:01.00] Hello world")
        self.assertEqual(plain, "Hello world")
        self.assertEqual(len(stripped.segments[0].words), 0)


if __name__ == "__main__":
    unittest.main()
