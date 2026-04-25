# Spec: Publish Flow Migration

## Problem

Existing publish flow works but is embedded in legacy UI logic and blocks modular migration.

## User Flow

1. User validates metadata and lyrics.
2. User starts publish.
3. UI shows deterministic steps: Validate -> PoW -> Publish -> Done.
4. On success/failure, user sees clear final state and can retry safely.

## Technical

- Preserve current PoW behavior and LRCLIB API compatibility.
- Move PoW compute to Web Worker to avoid UI jank.
- Isolate publish requests in frontend api module.
- Add explicit publish state machine for deterministic UI transitions.

## Edge Cases

- Long-running PoW solve.
- Publish API timeouts and retriable network errors.
- Challenge invalidation between request and publish submit.

## Testing

- Unit: publish state machine transitions.
- Unit: token/challenge formatting and validation.
- E2E: fetch -> sync -> publish success and failure paths.

## Out Of Scope

- LRCLIB API contract changes.
- Server-side PoW solving.
