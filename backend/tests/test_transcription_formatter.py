import unittest

from services.transcription.formatter import build_synced_lyrics
from services.transcription.types import (
    TranscribedSegment,
    TranscribedWord,
    TranscriptionResult,
)


class TestBuildSyncedLyrics(unittest.TestCase):
    def test_emits_enhanced_lrc_when_words_exist(self) -> None:
        # Given: a transcription segment with word-level timings.
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

        # When: synced and plain lyrics are formatted.
        synced, plain = build_synced_lyrics(result)

        # Then: the synced line includes word markers and plain text remains segment text.
        self.assertEqual(synced, "[00:01.00]<00:01.10>Hello <00:01.50>world")
        self.assertEqual(plain, "Hello world")

    def test_keeps_line_lrc_when_words_are_absent(self) -> None:
        # Given: a transcription segment without word-level timings.
        result = TranscriptionResult(
            provider="test",
            language="en",
            segments=[
                TranscribedSegment(
                    text="Hello world",
                    start=1.0,
                    end=2.0,
                )
            ],
            plain_text="Hello world",
        )

        # When: synced and plain lyrics are formatted.
        synced, plain = build_synced_lyrics(result)

        # Then: existing line-level LRC output is preserved exactly.
        self.assertEqual(synced, "[00:01.00] Hello world")
        self.assertEqual(plain, "Hello world")

    def test_skips_segment_when_timing_is_malformed(self) -> None:
        # Given: a wordless segment whose runtime timing value cannot be formatted.
        segment = TranscribedSegment(text="Hello world", start=1.0, end=2.0)
        segment.__dict__["start"] = "bad"
        result = TranscriptionResult(
            provider="test",
            language="en",
            segments=[segment],
            plain_text="Hello world",
        )

        # When: synced and plain lyrics are formatted.
        synced, plain = build_synced_lyrics(result)

        # Then: the unsafe timed segment is skipped entirely.
        self.assertEqual(synced, "")
        self.assertEqual(plain, "")


if __name__ == "__main__":
    unittest.main()
