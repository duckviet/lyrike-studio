# Spec: Lyrics Core Operations

## Problem

A DAW-like workflow requires structured lyrics state, keyboard-first editing, and reversible operations. Current textareas are insufficient.

## User Flow

1. User enters synced editor tab.
2. User taps timestamp on current line during playback.
3. User edits text inline and reorders rows.
4. User uses keyboard shortcuts for seek, sync, navigation, undo, and redo.

## Technical

- Add LyricsDoc and LyricsStore action surface.
- Add command-pattern history manager for:
  - SetTimestamp
  - EditText
  - InsertLine
  - DeleteLine
  - ReorderLines
- Add tabs for Synced, Plain, and Meta views.
- Add autosave draft keyed by videoId with recovery prompt.

## Edge Cases

- Duplicate timestamps and out-of-order line time.
- Split/merge with empty lines.
- Undo stack consistency after autosave restores.

## Testing

- Unit: store actions and history manager command behavior.
- E2E: keyboard-only sync loop and recovery prompt path.

## Out Of Scope

- External collaboration.
- AI-assisted lyric rewriting.
