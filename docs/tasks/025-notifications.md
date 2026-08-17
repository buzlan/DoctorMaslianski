# TASK-025 — Notifications

Status: POST-MVP — not part of the Pilot MVP

Milestone: Post-MVP (Notifications)

Do **not** implement during the Pilot MVP. Push notifications are not required for the first pilot.

This file remains a coarse placeholder for later work.

Notification contracts and backend schedules do not exist yet. **Do not implement this task from this file alone.**

Before implementation:

1. Re-enter Plan Mode against the real notification contract.
2. Split into smaller tasks if this placeholder is still too large (for example token registration vs reminder types vs deep links from notifications).
3. Do not treat the bullets below as frozen file lists or dependency choices.

## Goal (coarse)

Push token registration; reminders for tasks, check-ins, and appointments; taps open the right screen — once the backend can schedule them.

## Why this task is needed

This is the last major native companion loop. It depends on real identity and backend schedules.

## Dependencies

- Re-planned onboarding/identity work

## Out of scope until re-planned

- App-generated urgent medical alerts (“seek emergency care”)
- Emergency medical conclusions

## Expected files or areas affected

Unknown until re-plan.

## New dependencies

Unknown until re-plan.

## Plan Mode

Yes — **required re-plan**.

## Acceptance criteria (indicative)

Final criteria come from the re-plan.

Indicative:

- Permission flow exists.
- A reminder opens a relevant screen.
- Denied state remains usable.
- The application remains runnable.
- Notifications do not invent emergency medical conclusions.

## Verification

Defined in the re-plan.
