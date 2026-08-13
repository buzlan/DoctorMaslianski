# TASK-009 — Stage details

Status: NOT STARTED

Milestone: M4 — Treatment Timeline

## Goal

Open a stage to see its tasks, doctor-defined recommendations, and related requests (check-in / photo / appointment) as display-only.

## Why this task is needed

Timeline without details is a label list. Patients need the stage contents.

## Dependencies

- TASK-008

## Requirements

- Stack route above tabs, for example `src/app/treatment/[stageId].tsx`.
- Read-only except existing task completion if that task appears in the stage.
- No new medical logic.
- Display doctor-defined content only.

## Out of scope

- Editing stages
- Diary or photo capture (TASK-014 may later enter capture from this screen; this task stays display-only)

## Expected files or areas affected

- New route
- Stage detail presentation

## New dependencies

No.

## Plan Mode

Yes (navigation + data flow).

## Acceptance criteria

- Tap a stage opens details.
- Back returns to the timeline.
- Invalid id has a safe empty or error state.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify navigation on iOS Simulator and Android Emulator.
