# TASK-020 — Clinic contact and next appointment

Status: DONE

Milestone: M8 — Pilot companion completeness

## Goal

Show the **current** doctor-set next appointment and basic clinic contact / booking on **existing surfaces**. This is **not** a fourth “Связь с доктором” tab and **not** a Doctor tab.

Primary navigation while treatment is active remains exactly:

- Сегодня
- Лечение
- Дневник

## Surfaces

- **Today (required):** current next appointment **and** clinic contact / booking CTA.
- **Treatment (structural):** current next appointment only. No contact CTA on Treatment.
- **Completion screen:** TASK-028 reuses the same contact / booking CTA. This task does **not** hide tabs or build the completed-treatment shell.

## Why this task is needed

Patients need to know when the next visit is and how to reach the clinic, without expanding primary navigation.

## Dependencies

- TASK-015 (companion loop exists; appointment rows already live on `Treatment.appointments`)

## Requirements

- Next appointment is the current doctor-set row: `status === 'current'` (latest non-superseded). Not `appointmentPattern` on a protocol snapshot and not app scheduling logic.
- Doctor may later change date/time; the patient must see the updated current appointment. History is **superseded**, not silently destroyed. This task is display-only; it does not add a mobile write API.
- `Appointment.at` is a clinic-authored ISO datetime string. Display preserves the doctor-set **wall-clock** date/time from that string. Do not convert through the device timezone in a way that changes the wall-clock time. Do not add `clinicTimeZone` or a larger appointment schema in this task.
- Invalid or unparseable `at` uses the honest unavailable copy. Do not invent a date.
- Clinic contact is display-only and data-driven: `tel:`, `mailto:`, and `https:` (plus `http:` for booking URLs only). Do not open arbitrary schemes from clinic data. Use `Linking.canOpenURL` / `openURL` safely. Failed open uses short non-medical copy.
- If no clinic-approved phone / email / booking URL exists, show an honest unavailable state. Do **not** seed fake contact data.
- No custom messenger. No Doctor tab. No Photos tab. No Activity tab.
- Do not generate medical advice, emergency instructions, or triage copy.

## Out of scope

- Doctor dashboard / clinic-side appointment writes
- Messaging product
- Changing appointments on a server (clinic tool + later sync)
- Dedicated Doctor section as a top-level tab
- Completion-shell navigation (TASK-028 owns hiding tabs)
- HealthKit / Activity
- Push, QR/invite, Supabase
- Invented phone numbers, addresses, URLs, or `maslianski.by` as a stand-in booking channel

## Future backend note (not this task)

TASK-029 (and later sync) must explicitly define:

- clinic timezone
- datetime storage normalization
- patient display semantics for `Appointment.at`

Do not leave timestamptz vs clinic wall-clock implicit. TASK-020 only displays the authored ISO wall-clock.

## Expected files or areas affected

- Treatment domain helper for current appointment
- Today and Treatment read models / presentation
- Small `src/modules/clinic-contact/**` (no tab route)
- Copy catalog

## New dependencies

No.

## Plan Mode

Yes (placement on existing surfaces).

## Acceptance criteria

- Current next appointment is visible on Today and Treatment (empty state when none / unparseable).
- Clinic contact / booking is reachable from Today when channels exist; otherwise an honest unavailable state.
- Content comes from treatment/clinic data, not from a protocol snapshot pattern table.
- Primary navigation remains Today, Treatment, Diary while treatment is active.
- No fake phone / email / URL in fixtures or copy.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Manually verify on iOS Simulator and Android Emulator:

- Today shows honest empty next-appointment state
- Treatment shows honest empty next-appointment state
- Today shows honest unavailable clinic-contact state
- exactly three tabs remain
- no fake phone/email/url
- no Doctor tab
