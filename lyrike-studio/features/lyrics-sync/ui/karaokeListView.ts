import type { LyricLine, LyricWord } from "@/entities/lyrics";

export type KaraokeWordDisplay = {
  readonly word: LyricWord;
  readonly isActive: boolean;
  readonly isSelected: boolean;
};

export type KaraokeLineDisplay = {
  readonly line: LyricLine;
  readonly timeLabel: string;
  readonly words: KaraokeWordDisplay[];
  readonly hasWords: boolean;
};

export function getWordDisplayLabel(word: LyricWord): string {
  return word.text.trim();
}

export function getKaraokeLineDisplayProps(
  line: LyricLine,
  options: {
    isActive: boolean;
    isSelected: boolean;
    activeWordId: string | null;
    selectedWordId: string | null;
    formatTime: (seconds: number) => string;
  },
): KaraokeLineDisplay {
  const words = line.words ?? [];
  const timeLabel = `${options.formatTime(line.start)}–${options.formatTime(line.end)}`;

  return {
    line,
    timeLabel,
    hasWords: words.length > 0,
    words: words.map((word) => ({
      word,
      isActive: word.id === options.activeWordId,
      isSelected: word.id === options.selectedWordId,
    })),
  };
}
