# TASK-019 — Activity on Today and Activity tab

Status: POST-MVP — not part of the Pilot MVP

Milestone: Post-MVP (Activity)

Do **not** implement during the Pilot MVP. Pilot primary navigation is Today, Treatment, Diary only.

## Goal

Show steps versus the **doctor-defined** target from the treatment protocol. Add **Activity** as a primary section (intended fourth of the five: Today, Treatment, Diary, Activity, Doctor). Unavailable and denied states in Russian.

## Why this task is needed

Activity is only useful inside “what should I do today?” and as one of the compact primary sections — not a reason to add Photos to the tab bar.

## Dependencies

- TASK-017
- TASK-018

## Requirements

- Display only.
- If the protocol has no target, show steps without a goal — do not invent one.
- Tab bar at this point: Today, Treatment, Diary, Activity.
- Medical activity targets must originate from a doctor or treatment protocol.

## Out of scope

- Coaching
- Calorie models
- Exercise prescriptions
- A Photos tab

## Expected files or areas affected

- Today composition
- Activity presentation
- New Activity tab

## New dependencies

No.

## Plan Mode

Yes (composition of health + treatment).

## Acceptance criteria

- Today shows activity when permitted.
- Target comes only from the mock protocol.
- Activity is a primary section.
- Still no Photos tab.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify both platforms, including permission denied.
