# Spec: Media Pipeline Split

## Problem

Current extraction is bundled into one endpoint and does not expose stable media contracts for waveform seeking and asynchronous transcription workflows.

## User Flow

1. User provides YouTube URL.
2. Frontend requests fetch endpoint and receives normalized metadata.
3. Frontend starts playback from audio streaming endpoint.
4. User optionally triggers transcription without blocking playback setup.

## Technical

- Add/extend endpoints:
  - POST /local-api/fetch
  - POST /local-api/transcribe
  - GET /local-api/audio/{video_id}
  - GET /local-api/peaks/{video_id} (optional)
- Cache contract keyed by videoId.
- Audio route must support HTTP Range for seek stability.
- Keep /local-api/extract temporarily for compatibility.

## Edge Cases

- Invalid or unavailable YouTube media.
- Partial downloads interrupted and resumed.
- Repeated requests for same videoId during active processing.

## Testing

- Unit: videoId normalization and cache key generation.
- Integration: range request behavior and cache hit/miss paths.

## Out Of Scope

- Full transcription provider abstraction internals.
- Waveform UI integration.
