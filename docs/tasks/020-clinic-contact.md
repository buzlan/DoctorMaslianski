# TASK-020 — Clinic contact and next appointment

Status: NOT STARTED

Milestone: M8 — Pilot companion completeness

## Goal

Show basic doctor / clinic contact information and the **current** next appointment on **existing surfaces** (Today and/or Treatment).

The same contact / booking CTA is reused on the post-completion screen (TASK-028). This is **not** a fourth “Связь с доктором” tab and **not** a Doctor tab.

## Why this task is needed

Patients need to know how to reach the clinic and when the next visit is, without expanding primary navigation.

## Dependencies

- TASK-015 (companion loop exists; appointment data may already appear from earlier Today/Treatment work)

## Requirements

- Display-only contact (tel/mailto or equivalent).
- Next appointment is the current doctor-set row (latest non-superseded), not `appointmentPattern` on a protocol snapshot and not app scheduling logic.
- Doctor may later change date/time; the patient must see the updated current appointment without silently destroying history (history is data; this task displays current).
- No custom messenger.
- No Doctor tab. No Photos tab. No Activity tab.
- Do not generate medical advice.

## Out of scope

- Doctor dashboard
- Messaging product
- Changing appointments on a server (clinic tool + later sync)
- Dedicated Doctor section as a top-level tab
- Completion-shell navigation (TASK-028 owns hiding tabs)
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

- Clinic contact and current next appointment are reachable from Today and/or Treatment.
- Content comes from treatment/clinic data, not from a protocol snapshot pattern table.
- Primary navigation remains Today, Treatment, Diary while treatment is active.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify on iOS Simulator and Android Emulator.
