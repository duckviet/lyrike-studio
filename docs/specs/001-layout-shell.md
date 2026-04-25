# Spec: Layout Shell (S1)

## Problem

The current app is a single legacy page and cannot support DAW-like editing workflows. We need a modern shell that supports transport controls, waveform focus, and editor panels without breaking the existing flow.

## User Flow

1. Open new Lyrics Studio frontend route.
2. See responsive editor shell with left, center, and right panels on desktop.
3. On tablet/mobile, switch between tabs for the same panel content.
4. Continue using legacy page during migration when needed.

## Technical

- Entry points:
  - frontend/index.html
  - frontend/src/main.ts
  - frontend/src/App.svelte
- Add design tokens for light theme and accent system.
- Add shell layout primitives:
  - Desktop >= 1024px: 3 columns.
  - Mobile < 1024px: tabbed surface.
- Do not include business logic in shell components.

## Edge Cases

- Small viewport width and height combinations.
- Very long panel content requiring independent scrolling.
- Browser zoom at 125-200 percent.

## Testing

- Unit: layout utility state where applicable.
- E2E: viewport smoke checks for desktop/tablet/mobile shell rendering.

## Out Of Scope

- Waveform playback logic.
- Lyrics mutation behavior.
- Publish flow changes.
