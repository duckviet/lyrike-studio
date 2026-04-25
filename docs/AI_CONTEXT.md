# Lyrics Studio - AI Context

## Product And Naming

- Product display name: Lyrics Studio.
- Migration alias: LRCLIB Publisher.
- Use alias only for migration notes, compatibility labels, and legacy UI references.

## Project

Interactive lyrics editor workflow: YouTube fetch -> optional transcription -> waveform-assisted sync editing -> publish to LRCLIB.

Stack baseline:

- Frontend: Svelte + Vite + TypeScript
- Backend: FastAPI + yt-dlp + WhisperX

## Migration Guardrails

- Keep existing legacy static app runnable during migration.
- Introduce new frontend in a separate workspace folder before cutover.
- Do not remove or regress current publish capability while introducing editor features.

## Architecture Rules

- Frontend playback state: single MediaController event bus as source of truth.
- Lyrics state: mutation-only store actions in LyricsStore.
- LRC logic: parser/serializer isolated in lrc module.
- API calls: only through frontend api module.
- No business logic in Svelte components. Components render and dispatch intents.

## Backend API Boundaries

- local-api/fetch: metadata lookup and cached audio acquisition.
- local-api/transcribe: optional transcription flow keyed by videoId.
- local-api/audio/{video_id}: byte-range streaming for stable seek.
- local-api/peaks (optional): waveform peaks generation and cache access.

## Coding Conventions

- TypeScript strict mode; avoid any.
- Keep functions under 40 lines when practical; extract helpers.
- Use const by default.
- Prefer async/await; do not mix with .then() chains.
- Throw typed errors from shared frontend error module.

## Testing

- Vitest for unit tests (parser, store, history).
- Playwright for E2E smoke flow (fetch -> sync -> publish).
- New feature should include colocated tests where practical.

## Do Not

- Add heavy dependencies without explicit approval.
- Mutate store state directly; use actions/commands.
- Use innerHTML or eval.
- Hardcode URLs; use config module.

## Ownership

- src/lib/lrc.ts: pure parser/serializer, no DOM and no side effects.
- src/lib/MediaController.ts: owns audio lifecycle and playback events.
- src/lib/LyricsStore.ts: central mutation surface for lyrics document state.
- src/components/*: UI only.

## Preferred Commands

- make dev: run frontend and backend together.
- make test: run all tests.
- make lint: lint frontend and backend.
- make ai-context: print key context docs.
