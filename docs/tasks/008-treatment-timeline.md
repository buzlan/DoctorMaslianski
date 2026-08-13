# TASK-008 — Treatment Timeline

Status: NOT STARTED

Milestone: M4 — Treatment Timeline

## Goal

The Treatment tab lists stages: completed, current, and upcoming.

## Why this task is needed

Treatment Timeline is the core product concept after Today.

## Dependencies

- TASK-007 (so current/completed reflect in-memory completions)

## Requirements

- Thin `src/app/(tabs)/treatment.tsx`.
- Timeline presentation in `src/modules/treatment/presentation`.
- Same repository as Today.
- No app-generated medical commentary.

## Out of scope

- Stage detail navigation (TASK-009)
- Editing the protocol
- Doctor tools
- Backend

## Expected files or areas affected

- Treatment presentation
- Treatment route

## New dependencies

No.

## Plan Mode

Yes (product surface).

## Acceptance criteria

- Stages are visible in order.
- Current stage matches Today.
- Completions are reflected.
- The application remains runnable.
- The app does not invent medical conclusions about progress.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Tests for stage grouping.

Manually verify on iOS Simulator and Android Emulator.
