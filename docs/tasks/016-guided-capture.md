# TASK-016 — Guided capture

Status: NOT STARTED

Milestone: M7 — Progress Photos

## Goal

Positioning overlay / consistent angle helper for legs.

## Why this task is needed

PROJECT.md lists this as future photo quality. Keep it after basic capture so M7 still ships a usable capture flow without it.

## Dependencies

- TASK-015

## Requirements

- Overlay is guidance, not a medical measurement tool.
- The patient can still capture if the overlay is skipped (define in this task’s Plan Mode).
- Reuses TASK-014 entry points.
- Does not add a Photos tab.

## Out of scope

- Dedicated Photos tab
- Clinical measurement
- 3D
- Before/after morphing

## Expected files or areas affected

- Photos presentation / native camera UI

## New dependencies

Only if Plan Mode shows need.

## Plan Mode

Yes.

## Acceptance criteria

- Overlay is shown during capture.
- Photo is still saved with metadata.
- Navigation still has no Photos tab.
- The application remains runnable.
- The overlay does not measure or diagnose.

## Verification

Manually verify on iOS and Android.

```bash
npx tsc --noEmit
npm run lint
```
