# TASK-020 — Clinic contact and next appointment

Status: NOT STARTED

Milestone: M8 — Pilot companion completeness

## Goal

Show basic doctor / clinic contact information and the upcoming control appointment on **existing surfaces** (Today and/or Treatment).

This is **not** a Doctor tab and **not** a sixth (or fourth) primary section.

## Why this task is needed

Patients need to know how to reach the clinic and when the next visit is, without expanding primary navigation.

## Dependencies

- TASK-015 (companion loop exists; appointment data may already appear from TASK-006)

## Requirements

- Display-only contact (tel/mailto or equivalent).
- Next appointment comes from the treatment snapshot / clinic data, not from app scheduling logic.
- No custom messenger.
- No Doctor tab. No Photos tab. No Activity tab.
- Do not generate medical advice.

## Out of scope

- Doctor dashboard
- Messaging product
- Changing appointments on a server
- Dedicated Doctor section as a top-level tab
- HealthKit / Activity

## Expected files or areas affected

- Today and/or Treatment presentation
- Copy catalog
- Optional small `src/modules/doctor/**` or clinic contact types owned by treatment — only if needed. Do not create a tab route.

## New dependencies

No.

## Plan Mode

Yes (placement on existing surfaces).

## Acceptance criteria

- Clinic contact and next appointment are reachable from Today and/or Treatment.
- Content comes from snapshot/mock clinic data.
- Primary navigation remains Today, Treatment, Diary.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify on iOS Simulator and Android Emulator.
