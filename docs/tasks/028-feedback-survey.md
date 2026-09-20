# TASK-028 — Treatment completion screen and feedback survey

Status: DONE

Milestone: M8 — Pilot companion completeness

## Goal

When the **doctor** marks treatment complete, the patient leaves the three-tab shell and sees a simple **completion screen** with:

- clinic contact / booking CTA (same capability as TASK-020)
- optional end-of-treatment **FeedbackSurvey**: usefulness score 1–5 and clarity score 1–5 (“I understood what I needed to do”). No free-text field.

This is product validation, not a medical outcome score. The app does not decide that treatment is clinically finished.

## Why this task is needed

Doctor-decided completion is the end of the companion loop. Pilot metrics include patient usefulness and clarity. Feedback is numeric scores only; do not collect free text.

## Dependencies

- TASK-015 (companion loop exists)
- TASK-020 (contact/booking placement)
- TASK-027 (events)

TASK-041 is already done in code. `Treatment.status` includes `completed`. Do not implement from historically frozen snapshot-era specs (TASK-004, 005, 006, 027). Those DONE files still mention protocol snapshots and required `protocolKind` / `protocolVersion`; they must not drive this task.

## Internal order

Implement in this order inside the same task. Do not split unless Plan Mode shows the slice is too large for one review.

1. Root navigation gate: when `Treatment.status === 'completed'`, hide Today / Treatment / Diary tabs.
2. Simple completion screen that reuses the TASK-020 clinic contact / booking CTA.
3. Optional `FeedbackSurvey` **on that same screen**.

The survey happens **after** the shell exists, **on** the completion screen. It is not a pre-completion modal on Today. It is not required before the contact CTA.

## Requirements

- When `Treatment.status` is `completed`, do not show Today / Treatment / Diary tabs.
- Completion screen is the patient shell for that state.
- Contact / booking is always reachable on the completion screen. Survey submit must not gate it. Honest unavailable state when no clinic-approved channels exist (same as TASK-020).
- `cancelled` is **out of scope** for this screen. Only `completed` hides tabs. Do not invent a cancelled-journey UX; existing tabs may keep showing the honest no-active-treatment empty state.
- `FeedbackSurvey` entity stores integer usefulness and clarity scores only (structural 1–5, not medical thresholds). Do **not** store or render a free-text feedback field.
- Survey is optional. The patient may leave the completion screen without submitting.
- One survey per treatment. A second submit is ignored or treated as already present.
- ProductEvent `feedback_submitted` may include **numeric** usefulness/clarity only.
- ProductEvent `treatment_journey_completed` may use patient id, treatment id, and cohort only.
- **Do not** put free text, diagnoses, or clinical answers on ProductEvent, FeedbackSurvey, or local persistence. Do **not** attach superseded protocol snapshot event context (`protocolKind` / `protocolVersion`).
- Smallest ProductEvent adaptation for these two previously unemitted names: same pattern as `task_completed` (ids + cohort; scores only on `feedback_submitted`). Leave leftover unemitted snapshot types such as `treatment_started` alone unless this task emits them.
- The app must not interpret scores as clinical efficacy.
- Local survey persistence only. Remote flush is TASK-031. Reuse an existing local store pattern (AsyncStorage is acceptable: this is product validation, not diary answers). Do not add a new storage library unless Plan Mode proves need. Do not reuse the assignment-completion overlay or the diary store.
- Russian copy.
- No patient-facing “complete treatment” or “mark treatment finished” control. The doctor decides completion (TASK-034). This task only **displays** `status === 'completed'`.

## Verification without TASK-034

Doctor-side writes do not exist yet. Use a **development fixture** (or equivalent) with `status: 'completed'` for tests and manual verification of the shell.

The **default** development fixture stays `active` so Today / Treatment / Diary remain the normal run. Switching the fixture status to `completed` is a developer-only verification step, not a product control.

## Out of scope

- Hardcoded success thresholds
- Clinic review UI (other repo)
- Medical questionnaires beyond this product survey
- Free-text feedback
- Patient-initiated treatment completion
- `cancelled` treatment shell
- Push on completion (TASK-025, after TASK-034)
- Remote survey sync (TASK-031)

## Expected files or areas affected

- Root navigation gate (tabs vs completion stack)
- Feedback domain + presentation
- Development fixture status switch (default remains `active`)
- ProductEvent types/validators for `treatment_journey_completed` and `feedback_submitted`
- Copy catalog

## New dependencies

No.

## Plan Mode

Yes (navigation + completion state).

## Acceptance criteria

- Completed treatment hides main tabs and shows the completion screen.
- Contact / booking is reachable from that screen without submitting the survey.
- Survey can be submitted and persisted locally (usefulnessScore and clarityScore only).
- ProductEvent has no free text and no snapshot protocol pair on the events this task emits.
- Default fixture remains an active treatment; a completed fixture exists for verification.
- `cancelled` does not open the completion screen.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Manually verify on both platforms, including the completed-treatment shell (temporarily use the completed development fixture; restore `active` afterward).
