# TASK-012 — Symptom check-in UI and Diary tab

Status: NOT STARTED

Milestone: M6 — Symptom Diary

## Goal

The patient submits a check-in. Add the **Diary** tab (intended third of the five primary sections: Today, Treatment, Diary, Activity, Doctor). Today shows a check-in entry point when the protocol requests it.

## Why this task is needed

Vertical slice: collect symptoms, do not just model them.

## Dependencies

- TASK-011

## Requirements

- Form with local React state (no form library unless Plan Mode proves need).
- Persist locally.
- Russian copy.
- Today CTA only when the mock protocol says so — the app does not decide that a check-in is medically required.
- Collect structured patient information. Do not diagnose or give emergency conclusions.

## Out of scope

- History list (TASK-013)
- Doctor review
- Alerts such as “go to ER”
- Photos tab

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

- Submit from Diary and from Today when requested by the protocol.
- Data survives restart.
- Third tab (Diary) is visible.
- Primary navigation remains compact. No Photos tab.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Manually verify on iOS Simulator and Android Emulator.
