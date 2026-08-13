# TASK-011 — Symptom diary domain

Status: NOT STARTED

Milestone: M6 — Symptom Diary

## Goal

Check-in model: pain, swelling, heaviness, itching, burning, feeling compared with previous day. Validation rules that are structural (required fields, allowed scales) — not medical risk cutoffs.

## Why this task is needed

Domain before UI. Testable without camera or native APIs.

## Dependencies

- TASK-010 (reuse the persistence approach if it still fits; otherwise in-memory until TASK-012)

## Requirements

- `src/modules/diary/domain`
- Structural validation only.
- The app must not interpret scores as diagnosis or emergency.

## Out of scope

- UI
- Submission networking
- Notifications
- Medical risk thresholds
- Emergency conclusions

## Expected files or areas affected

- `src/modules/diary/**` domain and tests

## New dependencies

No.

## Plan Mode

Yes (new module).

## Acceptance criteria

- A validated check-in object exists.
- Unit tests pass.
- No UI is required.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```
