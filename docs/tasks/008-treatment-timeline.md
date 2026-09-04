# TASK-008 — Treatment Timeline

Status: NOT STARTED

Milestone: M4 — Treatment Timeline

## Goal

The Treatment tab shows clinical **milestones / visits** plus the **current treatment period** (“День N”), with previous periods and visits remaining in history.

## Why this task is needed

Treatment Timeline is the core product concept after Today. It is not a frozen protocol-stage list.

## Dependencies

- TASK-007 (so current/completed assignments can reflect in-memory completions if shown)

## Requirements

- Thin `src/app/(tabs)/treatment.tsx`.
- Timeline presentation in `src/modules/treatment/presentation`.
- Same repository as Today. Data comes from treatment periods and milestones, not from a `TreatmentSnapshot` stage list.
- Current period Day N is 1-based from the current period start. After a later control-visit continuation, a new period resets Day N to 1; this task should already compute from `TreatmentPeriod` so that reset is data, not a special UI hack.
- Do not use a fixed mock such as Preparation → Procedure → Day 1 → Day 7 → Control.
- No app-generated medical commentary.
- Doctor-uploaded visit photos are TASK-015; this task may leave photo slots empty.

## Out of scope

- Visit detail navigation (TASK-009)
- Patient photo gallery
- Editing assignments or the catalog
- Doctor tools in this app
- Backend

## Expected files or areas affected

- Treatment presentation
- Treatment route

## New dependencies

No.

## Plan Mode

Yes (product surface).

## Acceptance criteria

- Milestones / visits are visible in order.
- Current period “День N” matches the domain helper / Today’s date basis.
- Assignment completions are reflected if shown on this surface.
- The application remains runnable.
- The app does not invent medical conclusions about progress.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Tests for period Day N and milestone grouping.

Manually verify on iOS Simulator and Android Emulator.
