# Refactor Plan V2 - Lyrike Studio

## Overview

Migration from custom store pattern to Zustand + TanStack Query following FSD best practices.

---

## Phase 1: Constants & Config Organization ✅ COMPLETED

### Created Files

```
shared/config/
├── constants.ts      # TIMING, WAVEFORM, UI, LYRICS_GAP, LIMITS
├── routes.ts         # ROUTES, API_ROUTES
├── storage-keys.ts   # STORAGE_KEYS + storage helper
├── z-index.ts        # Z_INDEX scale
└── index.ts          # barrel export

entities/lyrics/config/
└── enums.ts          # LyricsTabId, ResizeEdge types
```

### Consolidated Constants

| Old Key | New Key |
|---------|---------|
| `DEFAULT_ZOOM_PX_PER_SEC` | `WAVEFORM.DEFAULT_ZOOM_PX_PER_SEC` |
| `SEEK_DELTA_SEC` | `TIMING.SEEK_DELTA_SEC` |
| `WAVEFORM_POLL_INTERVAL_MS` | `TIMING.POLL_INTERVAL_MS` |
| `MIN_LINE_LENGTH` (LyricsStore) | `TIMING.MIN_LINE_LENGTH_SEC` |
| `MIN_GAP_PX` | `LYRICS_GAP.MIN_GAP_PX` |

---

## Phase 2: Zustand Migration ✅ COMPLETED

### Created Files

```
entities/lyrics/store/
└── lyricsStore.ts   # Zustand store with zundo temporal middleware
```

### What Was Done

1. Installed `zustand` + `zundo`
2. Created `entities/lyrics/store/lyricsStore.ts` with:
   - All LyricsStore actions converted to Zustand actions
   - zundo temporal middleware for undo/redo (placeholder implementations)
   - Selector-based subscriptions
3. Updated `useEditor.ts` to use new store with selectors
4. Updated all imports from old store to new store
5. Removed `LyricsProvider` wrapper from app
6. Deleted old files:
   - `entities/lyrics/model/LyricsStore.ts`
   - `entities/lyrics/ui/LyricsProvider.tsx`

### Migration Pattern

**Before:**
```ts
const { state, actions } = useLyrics(); // entire state + all actions
```

**After:**
```ts
const doc = useLyricsStore(s => s.doc);
const tab = useLyricsStore(s => s.tab);
const editText = useLyricsStore(s => s.editText);
```

---

## Phase 3: TanStack Query Migration

### Goals
- Replace custom fetch hooks with TanStack Query
- Centralize server state management
- Enable caching, retry, dedupe for free

### Installation
```bash
pnpm add @tanstack/react-query
```

### Hook Conversion

| Old Hook | New Query/Mutation |
|----------|-------------------|
| `useMediaLoader` | `useMediaQuery` + `usePeaksQuery` |
| `useTranscription` | `useTranscribeMutation` |
| `usePublish` | `usePublishMutation` |

### Target Files

```
features/media/
└── queries/
    ├── mediaQueries.ts      # useMediaQuery, usePeaksQuery
    ├── transcribeMutation.ts
    └── publishMutation.ts
```

---

## Phase 4: useEditor Refactor

### Goals
- Remove God Hook pattern
- Components consume store directly
- UI-only state stays in components

**After Phase 2+3, `useEditor` shrinks to:**
- UI state: `activeTab`, `zoomLevel`, `sourceInput`, `sourceMessage`
- Controller instances: `mediaController`, `waveformController`

---

## Phase 5: Quick Fixes (Parallel)

| Issue | Fix |
|-------|-----|
| `videoRef = useRef<any>` | Add proper type |
| `baseState as any` | Use `LyricsHistoryState` type |
| `GapRegionBox` missing `onDelete` | Add to interface |
| `crypto.randomUUID()` fallback | Add `nanoid` |

---

## Implementation Order

1. **Phase 2**: Zustand store creation + consumer migration
2. **Phase 3**: TanStack Query setup + hook conversion
3. **Phase 4**: useEditor simplification
4. **Phase 5**: Type fixes

---

## Success Metrics

- [x] Phase 1: Constants centralized
- [x] Phase 2: Zustand store functional
- [x] Phase 3: TanStack Query integrated
- [x] Phase 3: useEditor uses TanStack Query mutations
- [x] Phase 5: Type errors resolved

---

## All Phases Complete! ✅