# TASK-028 — Treatment completion screen and feedback survey

Status: NOT STARTED

Milestone: M8 — Pilot companion completeness

## Goal

When the **doctor** marks treatment complete, the patient leaves the three-tab shell and sees a simple **completion screen** with:

- clinic contact / booking CTA (same capability as TASK-020)
- optional end-of-treatment **FeedbackSurvey**: usefulness score, clarity score (“I understood what I needed to do”), optional free text

This is product validation, not a medical outcome score. The app does not decide that treatment is clinically finished.

## Why this task is needed

Doctor-decided completion is the end of the companion loop. Pilot metrics include patient usefulness and clarity. Free text must not be stuffed into ProductEvent.

## Dependencies

- TASK-015 (companion loop exists)
- TASK-020 (contact/booking placement)
- TASK-027 (events)

## Requirements

- When `Treatment.status` is `completed`, do not show Today / Treatment / Diary tabs.
- Completion screen is the patient shell for that state.
- `FeedbackSurvey` entity stores scores and optional free text.
- ProductEvent `feedback_submitted` may include **numeric** usefulness/clarity only.
- ProductEvent `treatment_journey_completed` may use treatment id only. **Do not** put free text, diagnoses, or clinical answers on ProductEvent. Do not attach superseded protocol snapshot event context.
- The app must not interpret scores as clinical efficacy.
- Russian copy.

## Out of scope

- Hardcoded success thresholds
- Clinic review UI (other repo)
- Medical questionnaires beyond this product survey
- Push on completion (TASK-025, after TASK-034)

## Expected files or areas affected

- Root navigation gate (tabs vs completion stack)
- Feedback domain + presentation
- Copy catalog

## New dependencies

No.

## Plan Mode

Yes (navigation + completion state).

## Acceptance criteria

- Completed treatment hides main tabs and shows the completion screen.
- Contact / booking is reachable from that screen.
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

Manually verify on both platforms, including the completed-treatment shell.
