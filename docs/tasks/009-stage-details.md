# TASK-009 — Stage details

Status: NOT STARTED

Milestone: M4 — Treatment Timeline

## Goal

Open a stage from the **treatment snapshot** to see its tasks, doctor-defined recommendations, and related requests (check-in / photo / appointment) as display-only.

## Why this task is needed

Timeline without details is a label list. Patients need the stage contents from the assigned protocol version, not from a later clinic edit.

## Dependencies

- TASK-008

## Requirements

- Stack route above tabs, for example `src/app/treatment/[stageId].tsx`.
- Read from the treatment snapshot.
- Read-only except existing task completion if that task appears in the stage.
- No new medical logic.
- Check-in and photo requests are display/CTA placeholders until TASK-012 and TASK-014.

## Out of scope

- Editing stages or the protocol
- Diary or photo capture (later tasks may enter capture from this screen; this task stays display-only except task completion)

## Expected files or areas affected

- New route
- Stage detail presentation

## New dependencies

No.

## Plan Mode

Yes (navigation + data flow).

## Acceptance criteria

- Tap a stage opens details from the snapshot.
- Back returns to the timeline.
- Invalid id has a safe empty or error state.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify navigation on iOS Simulator and Android Emulator.
