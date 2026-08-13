# TASK-010 — Persist task completion

Status: NOT STARTED

Milestone: M5 — Local State and Persistence

## Goal

Task completion survives restart. Choose the smallest Expo-compatible store at plan time (likely an AsyncStorage overlay of completion IDs on the mock treatment — not a second source of truth for the protocol).

## Why this task is needed

This is the first real offline requirement. There is still no backend.

## Dependencies

- TASK-009 (Today and Timeline are both stable against the same repository)

## Requirements

- Persistence behind the treatment repository.
- Load on startup.
- Do not persist the whole mock protocol unless that is simpler than an overlay.
- Still no global state library unless Plan Mode for this task shows Context/repository is failing.
- Do not install storage “for diary/photos too” unless the same API is used immediately.

## Out of scope

- Sync
- Conflict resolution
- Encrypting medical records for production
- SQLite schema for all future entities
- Backend

## Expected files or areas affected

- Treatment infrastructure
- `src/core/` only if a generic storage wrapper is truly shared — otherwise keep storage in the treatment module until reuse is real

## New dependencies

Maybe yes (storage library). Justify in this task’s Plan Mode.

## Plan Mode

Yes (persistence).

## Acceptance criteria

- Kill and relaunch: completions remain.
- Mock protocol still comes from code/fixtures.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Tests with a fake store.

Manually verify restart on iOS Simulator and Android Emulator.
