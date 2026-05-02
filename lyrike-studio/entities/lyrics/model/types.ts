export type LyricLine = {
  id: string
  start: number
  end: number
  text: string
}

export type LyricsMeta = {
  title: string
  artist: string
  album: string
  by: string
  offset: number
}

export type LyricsDoc = {
  syncedLines: LyricLine[]
  plainLyrics: string
  meta: LyricsMeta
}

export type LyricsState = {
  doc: LyricsDoc
  selectedLineId: string | null
  tab: 'synced' | 'plain' | 'meta'
  canUndo: boolean
  canRedo: boolean
  activeLineId: string | null
  isAutoSyncEnabled: boolean
}