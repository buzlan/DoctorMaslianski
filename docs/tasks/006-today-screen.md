# TASK-006 — Today screen (read-only)

Status: NOT STARTED

Milestone: M3 — Today

## Goal

Today answers “Что делать сегодня?” from the mock repository: current stage, today’s tasks, next appointment, and loading / empty / error states.

## Why this task is needed

This is the primary patient surface and the first vertical slice on real domain data.

## Dependencies

- TASK-005

## Requirements

- `src/modules/today/presentation` composes UI.
- `buildTodayOverview` (or equivalent) stays outside React, owned by treatment or today/application.
- Route `src/app/(tabs)/index.tsx` stays thin.
- Empty state: no active treatment.
- Error state: repository failure (mock a path or a test double).
- Russian copy in the catalog. Protocol strings come from data.
- Display only. The app must not diagnose, prescribe, change treatment, invent recommendations, or set medical thresholds.

## Out of scope

- Completing tasks
- Diary / photos / activity actions
- Persistence
- State management library
- New tabs

## Expected files or areas affected

- `src/modules/today/**`
- Tab index route
- Possibly a treatment application query

## New dependencies

No.

## Plan Mode

Yes (Today data flow).

## Acceptance criteria

- Mock “today” renders from the repository.
- No writes.
- Medical constraints are respected (display only).
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Run tests for the overview builder.

Manually verify the Today screen on iOS Simulator and Android Emulator.
