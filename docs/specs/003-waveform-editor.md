# Spec: Waveform Playback Editor

## Problem

Users need a visual timeline and precise seek tools to sync lyrics accurately. Current UI has no waveform editor.

## User Flow

1. User opens waveform panel.
2. User plays/pauses using transport controls.
3. User clicks waveform to seek.
4. User adjusts zoom and loop region for fine sync work.
5. Active line highlights follow playback time.

## Technical

- Integrate WaveSurfer v7 with timeline plugin and regions.
- All seek and transport actions route through MediaController.
- Region operations update timestamps through LyricsStore actions.
- Keep text content unchanged for pure timing adjustments.

## Edge Cases

- Missing peaks fallback to live decode.
- Rapid seek updates causing highlight jitter.
- Loop boundaries outside media duration.

## Testing

- Unit: time mapping helpers and region-to-line conversions.
- E2E: play/seek/highlight sync smoke path.

## Out Of Scope

- Full editing command history.
- Publish UX enhancements.
