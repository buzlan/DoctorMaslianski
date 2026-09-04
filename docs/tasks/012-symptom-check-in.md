# TASK-012 — Symptom check-in UI and Diary tab

Status: NOT STARTED

Milestone: M6 — Symptom Diary

## Goal

The patient submits the daily diary. Add the **Diary** tab. This is the **third and final primary navigation destination** while treatment is active (Today, Treatment, Diary).

Today shows a diary entry point when today’s entry is **not yet submitted**. After submission, it is not offered again until the next calendar day.

## Why this task is needed

Vertical slice: collect symptoms, do not just model them.

## Dependencies

- TASK-011

## Requirements

- Form with local React state (no form library unless Plan Mode proves need).
- Persist locally.
- Russian copy.
- Today CTA only when today’s diary is incomplete — the app does not decide that a check-in is medically required.
- Collect structured patient information. Do not diagnose or give emergency conclusions.
- ProductEvent `checkin_requested` / `checkin_submitted` may count completion only. **Do not** put raw answers in event metadata. Do not attach superseded protocol snapshot event context.

## Out of scope

- History list (TASK-013)
- Doctor review
- Alerts such as “go to ER”
- Photos tab
- Activity or Doctor tabs
- Offering diary after treatment completion (completion shell is TASK-028)

## Expected files or areas affected

- Diary presentation
- `src/app/(tabs)/diary.tsx`
- Copy catalog
- Today composition

## New dependencies

No (default).

## Plan Mode

Yes.

## Acceptance criteria

- Submit from Diary and from Today when today’s entry is missing.
- After submit, Today does not offer diary again until the next civil date.
- Data survives restart.
- Third tab (Diary) is visible while treatment is active and is the last primary tab for the pilot.
- No Photos, Activity, or Doctor tab.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Manually verify on iOS Simulator and Android Emulator.
