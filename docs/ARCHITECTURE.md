# Architecture

## Product Transition

- Legacy mode: current static UI remains available during migration.
- New mode: Svelte + Vite app is developed in parallel and promoted incrementally.
- Playback source: extracted audio pipeline is authoritative for timing and seek precision.
- YouTube iframe is optional visual reference only.

## Core Ownership

- MediaController owns playback source of truth and transport events.
- LyricsStore owns document mutations and undo/redo-compatible actions.
- lrc module owns parse/serialize behavior only.
- api module owns HTTP transport and request/response normalization.

## Event And Data Flow

1. User action in component dispatches intent.
2. Intent calls LyricsStore action or MediaController command.
3. Store/controller emits state updates.
4. Subscribers update transport UI, waveform cursor, line highlight, and editor rows.

Playback flow:

audio element -> MediaController -> timeline cursor + active lyric + transport state

Editing flow:

editor action -> LyricsStore mutation -> derived line timing/selection -> waveform regions sync

## Backend Contracts

- POST local-api/fetch
	- Input: URL or normalized video identifier.
	- Output: metadata + cache location identifiers.
- POST local-api/transcribe
	- Input: videoId.
	- Output: status + optional transcript payload.
- GET local-api/audio/{video_id}
	- Supports Range requests.
	- Streams cached audio for stable seek.
- GET local-api/peaks/{video_id} (optional)
	- Returns cached peaks or generates on demand.

## Frontend Module Boundaries

- src/components/*
	- Rendering, local interaction wiring, accessibility semantics.
	- No parser logic, no transport state ownership.
- src/lib/MediaController.ts
	- play/pause/seek/loop controls.
	- Emits clock and transport events.
- src/lib/LyricsStore.ts
	- Actions: setTimestamp, editText, insert, delete, reorder, split, merge.
- src/lib/lrc.ts
	- parseLrc, serializeLrc, metadata helpers.
- src/lib/history/*
	- Command pattern and undo/redo stack.
- src/lib/api.ts
	- Fetch/transcribe/audio/peaks/publish request helpers.

## Waveform Integration Notes

- Use WaveSurfer v7 with timeline and regions.
- Waveform seeks must route through MediaController.
- Region edits map to timestamp updates without destructive lyric text edits.

## Quality Gates

- Unit coverage: parser, store actions, history commands.
- Smoke E2E: fetch -> sync -> publish.
- Accessibility and keyboard pass required for editor-critical flows.
