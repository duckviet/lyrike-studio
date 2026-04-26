# Migration Plan: @frontend → @lyrike-studio

## Overview
- **Source**: Svelte 5 + Vite (@frontend/)
- **Target**: Next.js 15 + React 19 + TailwindCSS 4 (@lyrike-studio/)
- **Architecture**: Feature-Sliced Design (FSD)
- **Approach**: Full feature migration (convert directly to React + Tailwind)

---

## Phase 1: Setup & Core Infrastructure

### 1.1 Dependencies
Add to `package.json`:
```json
"dependencies": {
  "wavesurfer.js": "^7.12.6"
}
```

### 1.2 TailwindCSS 4 Theme (app/globals.css)

```css
@import "tailwindcss";

:root {
  /* Backgrounds */
  --bg: #f7f8ef;
  --bg-soft: #eef2dd;
  --bg-elev: #fffffb;
  
  /* Text */
  --ink: #1f2918;
  --ink-soft: #5d6650;
  
  /* Borders */
  --line: #d7dec2;
  
  /* Primary */
  --primary: #b7df2d;
  --primary-deep: #86a91c;
  
  /* Indigo */
  --indigo: #4a57b2;
  --indigo-soft: #eef2ff;
  
  /* Danger */
  --danger: #a33a3a;
  
  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(31, 41, 24, 0.05);
  --shadow: 0 10px 28px rgba(31, 41, 24, 0.08);
  
  font-family: "Sora", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

@theme inline {
  --color-bg: var(--bg);
  --color-bg-soft: var(--bg-soft);
  --color-bg-elev: var(--bg-elev);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-line: var(--line);
  --color-primary: var(--primary);
  --color-primary-deep: var(--primary-deep);
  --color-indigo: var(--indigo);
  --color-indigo-soft: var(--indigo-soft);
  --color-danger: var(--danger);
  --color-radius-sm: var(--radius-sm);
  --color-radius-md: var(--radius-md);
  --color-radius-lg: var(--radius-lg);
}

body {
  margin: 0;
  background: radial-gradient(circle at 85% 0%, rgba(210, 242, 95, 0.28), transparent 34%),
    radial-gradient(circle at 10% 100%, rgba(219, 224, 255, 0.42), transparent 34%),
    var(--bg);
  overflow: hidden;
}
```

### 1.3 FSD Directory Structure

```
lyrike-studio/
├── app/
│   ├── page.tsx              # Main editor route
│   └── layout.tsx            # Root layout
├── features/
│   └── editor/
│       ├── components/       # Editor UI components
│       ├── hooks/         # Editor hooks (useLyrics, useMedia, etc.)
│       └── types.ts       # Editor types
├── entities/
│   ├── lyrics/
│   │   └── types.ts      # LyricLine, LyricsDoc, LyricsState
│   └── media/
│       └── types.ts      # MediaTrack types
├── shared/
│   ├── ui/               # Shared UI primitives
│   └── utils/            # Utility functions
└── lib/                      # Core business logic (from frontend/)
    ├── api.ts
    ├── LyricsStore.ts
    ├── lyricsTimeline.ts
    ├── lrc.ts
    ├── MediaController.ts
    ├── WaveformController.ts
    └── app/
        ├── draftManager.ts
        ├── editorLifecycleController.ts
        ├── formatters.ts
        import keyboardShortcuts.ts
        import lyricsActions.ts
        import mediaWorkflow.ts
        import powWorkerClient.ts
        import publishFlow.ts
        import publishPayload.ts
```

---

## Phase 2: Core Business Logic (Port from src/lib/)

| Module | Action | Notes |
|--------|--------|-------|
| `lib/api.ts` | COPY | Keep types, update fetch URLs |
| `lib/LyricsStore.ts` | CONVERT | Class to React Context + useReducer |
| `lib/lyricsTimeline.ts` | COPY | Pure functions |
| `lib/lrc.ts` | COPY | Pure functions |
| `lib/config.ts` | COPY | Config constants |
| `lib/MediaController.ts` | CONVERT | Class to useMediaController hook |
| `lib/WaveformController.ts` | CONVERT | Class to useWaveformController hook |
| `lib/history/HistoryManager.ts` | COPY | Generic history stack |
| `lib/app/*.ts` | COPY/CONVERT | Each module needs review |

---

## Phase 3: Components Migration

| Svelte Component | to React (FSD) | Lines |
|-----------------|----------------|------|
| `App.svelte` | to `app/page.tsx` | 640 to Main editor shell |
| `SourcePanel.svelte` | to `features/editor/components/SourcePanel.tsx` | 459 |
| `TimelinePanel.svelte` | to `features/editor/components/TimelinePanel.tsx` | 354 |
| `LyricsPanel.svelte` | to `features/editor/components/LyricsPanel.tsx` | 340 |
| `LyricLineItem.svelte` | to `features/editor/components/LyricLineItem.tsx` | ~150 |
| `LyricRegionsTrack.svelte` | to `features/editor/components/LyricRegionsTrack.tsx` | ~120 |
| `VideoPlayer.svelte` | to `features/editor/components/VideoPlayer.tsx` | ~80 |
| `MobileTabs.svelte` | to `shared/ui/MobileTabs.tsx` | ~50 |

### 3.1 State Management Pattern

```tsx
// lib/LyricsStore.ts to context
'use client'
import { createContext, useContext, useReducer } from 'react'

type LyricsContextType = {
  state: LyricsState
  dispatch: React.Dispatch<LyricsAction>
}

const LyricsContext = createContext<LyricsContextType | null>(null)

export function LyricsProvider({ children }) {
  const [state, dispatch] = useReducer(lyricsReducer, initialState)
  return <LyricsContext.Provider value={{ state, dispatch }}>{children}</LyricsContext.Provider>
}

export function useLyrics() {
  const ctx = useContext(LyricsContext)
  if (!ctx) throw new Error('useLyrics must be within LyricsProvider')
  return ctx
}
```

---

## Phase 4: Controllers to Hooks

| Svelte Class | to React Hook |
|------------|------------|
| `MediaController` | `useMediaController` |
| `WaveformController` | `useWaveformController` |

---

## Phase 5: Styling Migration

| Svelte | to TailwindCSS |
|--------|------------|
| Scoped `<style>` | Utility classes + `@apply` |
| CSS variables | Tailwind theme tokens |
| Media queries | Tailwind responsive |

### 5.1 Component Style Conversion Example

```svelte
<!-- Svelte -->
<style>
  .btn {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.48rem 0.8rem;
    background: #f4f6e8;
  }
</style>
```

```tsx
<!-- React + Tailwind -->
<button className="border border-line rounded-full px-4 py-2 bg-bg-soft">
  Button text
</button>
```

---

## Implementation Order

1. Setup Phase: TailwindCSS theme, directory structure
2. Copy @frontend/src/lib/ to lyrike-studio/lib/
3. Convert LyricsStore.ts to React Context
4. Convert controllers to hooks
5. Port components in order:
   - SourcePanel to VideoPlayer to TimelinePanel to LyricsPanel to LyricLineItem to LyricRegionsTrack to MobileTabs
6. Wire up main page.tsx with all components
7. Test and fix issues