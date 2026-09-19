# TASK-006 — Today screen (read-only)

Status: DONE

Milestone: M3 — Today

## Goal

Today answers “Что делать сегодня?” from the assigned treatment **snapshot**: current stage, today’s tasks, next appointment, and loading / empty / error states.

When the snapshot requests a check-in or photo for today, show that as a display/entry affordance even if the full flows land in later tasks.

## Why this task is needed

This is the primary patient surface and the first vertical slice on real domain data.

## Dependencies

- TASK-005
- TASK-027 (ProductEvent port should exist so this screen can emit `treatment_started` / session events without clinical payloads)

## Requirements

- `src/modules/today/presentation` composes UI.
- `buildTodayOverview` (or equivalent) stays outside React, owned by treatment or today/application, and reads the **snapshot**.
- Route `src/app/(tabs)/index.tsx` stays thin.
- Empty state: no active treatment.
- Error state: repository failure (mock a path or a test double).
- Russian copy in the catalog. Protocol strings come from the snapshot.
- No walking goal, activity goal, or HealthKit.
- Display only. The app must not diagnose, prescribe, change treatment, invent recommendations, or set medical thresholds.
- If emitting ProductEvents: include protocol kind, protocol version, and cohort when known. **Do not** put check-in answers, medical text, or photo URLs in event metadata.

## Out of scope

- Completing tasks (TASK-007)
- Diary / photos capture flows (TASK-012 / TASK-014)
- Persistence
- State management library
- New tabs
- Activity / Doctor tabs

## Expected files or areas affected

- `src/modules/today/**`
- Tab index route
- Possibly a treatment application query

## New dependencies

No.

## Plan Mode

Yes (Today data flow).

## Acceptance criteria

- Mock “today” renders from the snapshot.
- No writes except optional ProductEvents.
- No activity/walking goal.
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
