# TASK-017 — HealthKit daily steps (iOS)

Status: NOT STARTED

Milestone: M8 — Activity

## Goal

Request permission, read today’s step count, and isolate HealthKit behind an application-owned health port.

## Why this task is needed

HealthKit is the iOS activity source.

## Dependencies

- TASK-010 (Today is stable). No hard dependency on photos.
- Kept after M7 only to avoid overlapping native tracks; can be reordered after TASK-010 if desired.

## Requirements

- Expo-compatible HealthKit approach from Expo SDK 57 docs.
- Fail gracefully if denied.
- No background delivery unless required for this read.
- Medical step targets are not invented here. Reading steps only.

## Out of scope

- Android
- Writing to HealthKit
- Extra metrics
- Inventing a step goal
- Display on Today (TASK-019)

## Expected files or areas affected

- `src/modules/activity/**`
- iOS config / `app.json` usage strings

## New dependencies

Likely yes. Choose in Plan Mode against Expo SDK 57 docs.

## Plan Mode

Yes (native integration).

## Acceptance criteria

- On iOS Simulator or device with Health data, steps are readable or there is a clear denied/unavailable state.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

iOS verification is required.

Smoke-test Android that the build still runs.
