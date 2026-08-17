# TASK-011 — Symptom diary domain

Status: NOT STARTED

Milestone: M6 — Symptom Diary

## Goal

Check-in model driven by **protocol-defined questions** on the treatment snapshot. Validation is structural (required fields, allowed scales) — not medical risk cutoffs.

The symptom list previously drafted (pain, swelling, heaviness, itching, burning, feeling vs previous day) is a **proposal for clinic confirmation** in TASK-026, not app-invented medicine. If the doctor specifies different questions, the schema follows the protocol.

## Why this task is needed

Domain before UI. Testable without camera or native APIs. Questions must not be hardcoded as clinical truth in the app.

## Dependencies

- TASK-010 (reuse persistence if it still fits; otherwise in-memory until TASK-012)
- Protocol question definitions from the snapshot (TASK-004 / TASK-026)

## Requirements

- `src/modules/diary/domain`
- Structural validation only.
- The app must not interpret scores as diagnosis or emergency.
- Clinical answer values belong on `CheckIn`, never on `ProductEvent` metadata.

## Out of scope

- UI
- Submission networking
- Notifications
- Medical risk thresholds
- Emergency conclusions
- Inventing check-in questions if the clinic has specified others

## Expected files or areas affected

- `src/modules/diary/**` domain and tests

## New dependencies

No.

## Plan Mode

Yes (new module).

## Acceptance criteria

- A validated check-in object exists against protocol-defined questions.
- Unit tests pass.
- No UI is required.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```
