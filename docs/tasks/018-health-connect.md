# TASK-018 — Health Connect daily steps (Android)

Status: POST-MVP — not part of the Pilot MVP

Milestone: Post-MVP (Health Connect / Activity)

Do **not** implement during the Pilot MVP. There is no Activity tab and no Health Connect requirement for the sclerotherapy pilot.

## Goal

Same product port as TASK-017, Android implementation via Health Connect.

## Why this task is needed

Health Connect is the Android activity source.

## Dependencies

- TASK-017’s port shape (implement TASK-017 first so the interface exists, unless Plan Mode introduces a thin shared port jointly).

## Requirements

- Permission.
- Read daily steps.
- Same domain model as iOS.
- Fail gracefully if denied or unavailable.

## Out of scope

- iOS
- Extra metrics
- App-defined goals
- Display on Today (TASK-019)

## Expected files or areas affected

- Activity Android adapter
- Android Health Connect configuration

## New dependencies

Likely yes. Choose in Plan Mode against Expo SDK 57 docs.

## Plan Mode

Yes (native integration).

## Acceptance criteria

- Steps or a denied/unavailable state on emulator or device.
- iOS still works.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Android verification is required.

Smoke-test iOS.
