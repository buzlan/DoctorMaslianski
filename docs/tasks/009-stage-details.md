# TASK-009 — Visit / milestone details

Status: DONE

Milestone: M4 — Treatment Timeline

## Goal

Open a treatment **milestone / visit** to see clinic-defined display content and related requests as display-only (aside from existing assignment completion if it appears here).

Doctor-uploaded photos for that visit are displayed in TASK-015; this task may show a placeholder slot.

## Why this task is needed

Timeline without details is a label list. Patients need visit contents from **this patient’s treatment records**, not from a protocol snapshot or a later catalog edit.

## Dependencies

- TASK-008

## Requirements

- Stack route above tabs, for example `src/app/treatment/[milestoneId].tsx`.
- Read from treatment milestones / assignments, not from `TreatmentSnapshot` stages.
- Read-only except existing assignment completion if that assignment appears in the visit context.
- No new medical logic.
- Diary and patient-photo requests are display/CTA placeholders until TASK-012 and TASK-014 if they belong on this screen at all (patient photos upload from Today; do not add a patient gallery here).

## Out of scope

- Editing milestones or the catalog
- Patient photo capture (TASK-014)
- Doctor photo viewing UI if still empty (TASK-015)
- Protocol editor

## Expected files or areas affected

- New route
- Visit detail presentation

## New dependencies

No.

## Plan Mode

Yes (navigation + data flow).

## Acceptance criteria

- Tap a visit opens details from the patient’s treatment records.
- Back returns to the timeline.
- Invalid id has a safe empty or error state.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify navigation on iOS Simulator and Android Emulator.
