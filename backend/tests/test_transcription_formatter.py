import unittest

from services.transcription.formatter import (
    build_synced_lyrics,
    normalize_word_timings,
)
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


def _words(starts: list[float], end: float) -> list[TranscribedWord]:
    ends = starts[1:] + [end]
    return [
        TranscribedWord(word="no", start=s, end=e) for s, e in zip(starts, ends)
    ]


class TestNormalizeWordTimings(unittest.TestCase):
    def test_spreads_collapsed_run_by_borrowing_from_neighbours(self) -> None:
        # Given: five "no" collapsed into 40ms steps (real aligner output).
        starts = [50.40, 50.44, 50.48, 50.52, 50.56, 50.94, 51.36, 51.90, 52.16, 52.40]
        words = _words(starts, 54.12)

        out = normalize_word_timings(words, 54.12, min_duration=0.12)

        new_starts = [w.start for w in out]
        # Then: every word in the former run lasts at least 0.12s.
        gaps = [b - a for a, b in zip(new_starts, new_starts[1:] + [54.12])]
        self.assertTrue(all(g >= 0.12 - 1e-6 for g in gaps[:6]), gaps)
        # And: first/last starts and the later words are untouched.
        self.assertEqual(new_starts[0], 50.40)
        self.assertEqual(new_starts[6:], starts[6:])
        # And: order stays monotonic.
        self.assertEqual(new_starts, sorted(new_starts))

    def test_leaves_normal_timings_untouched(self) -> None:
        words = _words([1.0, 1.5, 2.0], 2.6)
        self.assertEqual(normalize_word_timings(words, 2.6), words)

    def test_even_split_when_line_is_too_short_for_minimum(self) -> None:
        words = _words([0.0, 0.01, 0.02, 0.03], 0.2)  # 4 words in 0.2s
        out = normalize_word_timings(words, 0.2, min_duration=0.12)
        gaps = [
            b - a
            for a, b in zip([w.start for w in out], [w.start for w in out][1:] + [0.2])
        ]
        for g in gaps:
            self.assertAlmostEqual(g, 0.05)

    def test_skips_non_monotonic_input(self) -> None:
        words = _words([2.0, 1.0], 3.0)
        self.assertEqual(normalize_word_timings(words, 3.0), words)


if __name__ == "__main__":
    unittest.main()
