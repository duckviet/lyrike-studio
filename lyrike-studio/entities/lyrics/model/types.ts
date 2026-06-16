export type LyricWord = {
  readonly id: string
  readonly start: number
  readonly end: number
  readonly text: string
}

export type LyricLine = {
  readonly id: string
  readonly start: number
  readonly end: number
  readonly text: string
  readonly words?: readonly LyricWord[]
}

export type LyricsMeta = {
  readonly title: string
  readonly artist: string
  readonly album: string
  readonly by: string
  readonly offset: number
}

export type LyricsDoc = {
  readonly syncedLines: LyricLine[]
  readonly plainLyrics: string
  readonly meta: LyricsMeta
}

export type LyricsState = {
  readonly doc: LyricsDoc
  readonly selectedLineId: string | null
  readonly tab: 'synced' | 'karaoke' | 'plain' | 'meta'
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly activeLineId: string | null
  readonly isAutoSyncEnabled: boolean
}
