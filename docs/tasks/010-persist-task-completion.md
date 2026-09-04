# TASK-010 — Persist assignment completion

Status: DONE

Milestone: M5 — Local State and Persistence

## Goal

Assignment completion survives restart. Choose the smallest Expo-compatible store at plan time (likely an overlay of `ActionCompletion` records — not a second source of truth for the catalog, and not a rewrite of clinic content fixtures).

## Why this task is needed

This is the first real offline requirement. There is still no backend.

## Dependencies

- TASK-009 (Today and Timeline are both stable against the same repository)

## Requirements

- Persistence behind the treatment repository.
- Load on startup.
- Persist completion overlay (assignment id + civil date), not an entire mock protocol snapshot.
- Still no global state library unless Plan Mode for this task shows Context/repository is failing.
- Do not install storage “for diary/photos too” unless the same API is used immediately.
- Disabling an assignment must not delete persisted completions.

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

`@react-native-async-storage/async-storage` (SDK 57 compatible, installed with `npx expo install`).

AsyncStorage is used because this task persists only the completion overlay:

- `treatmentId`
- `assignmentId`
- `completedOn`

Do not treat this as a decision to store future diary answers, patient photos, or other clinical payloads in AsyncStorage. Local-at-rest storage requirements must be reviewed before real-patient rollout.

## Plan Mode

Yes (persistence).

## Acceptance criteria

- Kill and relaunch: completions remain.
- Catalog / assignment definitions still come from code/fixtures or later sync, not from rewriting history.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Tests with a fake store.

Manually verify restart on iOS Simulator and Android Emulator.
