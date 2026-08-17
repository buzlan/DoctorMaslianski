# TASK-028 — End-of-treatment feedback survey

Status: NOT STARTED

Milestone: M8 — Pilot companion completeness

## Goal

Patient submits an end-of-treatment **FeedbackSurvey**: usefulness score, clarity score (“I understood what I needed to do”), optional free text.

This is product validation, not a medical outcome score.

## Why this task is needed

Pilot metrics include patient usefulness and clarity. Free text must not be stuffed into ProductEvent.

## Dependencies

- TASK-015 (companion loop exists)
- TASK-027 (events)

## Requirements

- `FeedbackSurvey` entity stores scores and optional free text.
- ProductEvent `feedback_submitted` may include **numeric** usefulness/clarity only.
- **Do not** put free text, diagnoses, or clinical answers on ProductEvent.
- The app must not interpret scores as clinical efficacy.
- Russian copy.
- Entry from Today and/or Treatment when the snapshot says the journey is complete (protocol-defined), not when the app decides medically.

## Out of scope

- Hardcoded success thresholds
- Clinic review UI (other repo)
- Medical questionnaires beyond this product survey

## Expected files or areas affected

- Feedback domain + presentation
- Today/Treatment composition
- Copy catalog

## New dependencies

No.

## Plan Mode

Yes.

## Acceptance criteria

- Survey can be submitted and persisted locally.
- Scores and free text live on FeedbackSurvey.
- ProductEvent has no free text.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Manually verify on both platforms.
