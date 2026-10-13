import unittest

from services.transcription.types import TranscribedWord
from services.transcription.lyrics_alignment import (
    assign_lyrics_to_segments,
    build_line_segments,
    clean_lyrics,
    fill_missing_times,
    split_lines,
    times_from_asr_words,
    tokenize_lyrics,
)


class TestLyricsAlignment(unittest.TestCase):
    def test_clean_lyrics_strips_lrc_markup(self) -> None:
        raw = "[ti:Song]\n[00:12.30]Hello <00:12.50>world\n\n[01:02]Bye"
        self.assertEqual(clean_lyrics(raw), "Hello world\n\nBye")

    def test_assign_recovers_from_misheard_words(self) -> None:
        lyrics = "hello darkness my old friend i've come to talk with you again".split()
        asr = [
            ["hello", "dark", "this", "my", "old", "friend"],
            ["i've", "come", "to", "talk", "with", "you", "again"],
        ]
        self.assertEqual(assign_lyrics_to_segments(asr, lyrics), [(0, 5), (5, 12)])

    def test_assign_covers_all_lyrics_when_asr_missed_a_part(self) -> None:
        lyrics = "a b c d e f g h".split()
        asr = [["a", "b"], ["g", "h"]]
        ranges = assign_lyrics_to_segments(asr, lyrics)
        self.assertEqual(ranges[0][0], 0)
        self.assertEqual(ranges[-1][1], len(lyrics))
        self.assertEqual(ranges[0][1], ranges[1][0])

    def test_fill_missing_times_spreads_between_neighbours(self) -> None:
        out = fill_missing_times([(1.0, 2.0), (None, None), (None, None), (5.0, 6.0)], 0, 10)
        self.assertEqual(out[0], (1.0, 2.0))
        self.assertAlmostEqual(out[1][0], 2.0)
        self.assertAlmostEqual(out[2][1], 5.0)

    def test_build_line_segments_groups_words_by_line(self) -> None:
        lines = split_lines("one two\n\nthree")
        tokens = tokenize_lyrics(lines, "en")
        times = [(0.0, 1.0), (1.0, 2.0), (3.0, 4.0)]
        segs = build_line_segments(lines, tokens, times)
        self.assertEqual([s.text for s in segs], ["one two", "three"])
        self.assertEqual((segs[0].start, segs[0].end), (0.0, 2.0))
        self.assertEqual(len(segs[0].words), 2)

    def test_times_from_asr_words_keeps_user_text_and_asr_timing(self) -> None:
        asr = [
            TranscribedWord("Hello,", 1.0, 1.4),
            TranscribedWord("wurld", 1.5, 1.9),
            TranscribedWord("again", 2.0, 2.5),
        ]
        out = times_from_asr_words(["hello", "world", "again"], asr, "english")
        self.assertEqual(out[0], (1.0, 1.4))
        self.assertEqual(out[1], (None, None))
        self.assertEqual(out[2], (2.0, 2.5))
        filled = fill_missing_times(out, 0, 10)
        self.assertAlmostEqual(filled[1][0], 1.4)
        self.assertAlmostEqual(filled[1][1], 2.0)


if __name__ == "__main__":
    unittest.main()
