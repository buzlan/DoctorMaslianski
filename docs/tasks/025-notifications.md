# TASK-025 — Push notifications for doctor-side changes

Status: NOT STARTED

Milestone: M11b — after Clinic Review (TASK-034)

Push notifications **are part of the Pilot MVP**. They exist so the patient is notified when the doctor changes relevant treatment information.

**End-to-end implementation depends on TASK-034.** Clinic-side writes (assignments, appointment, possibly treatment completion) must exist so the workflow is verifiable. Backend/mobile prerequisites (auth session, push token registration, payload shape) may be prepared in M9/M10, but do not treat this task as done until a real clinic-side change can produce a patient notification.

Do **not** implement this task from this file alone without a Plan Mode pass against the actual Expo / backend contract.

Before implementation:

1. Re-enter Plan Mode against the real notification contract (Expo push + how the other repo triggers sends).
2. Split into smaller tasks if this file is still too large (token registration vs send vs tap routing).
3. Do not treat the bullets below as frozen file lists or dependency choices.

## Goal

When the doctor changes relevant **assignments**, the **appointment**, and possibly **treatment completion**, the patient receives a push notification.

Notification text must remain **non-diagnostic** and must avoid unnecessary medical details (no catalog instructions, no diary values, no photo content).

Taps open a relevant existing screen (Today, Treatment, or the completion screen). Denied notification permission must leave the app usable; sync still updates the plan when the patient opens the app.

## Why this task is needed

The doctor can change the patient’s schedule after invite. The patient needs a prompt, non-clinical notice that something changed.

## Dependencies

- **TASK-034** (clinic-side writes)
- TASK-031 (sync so the app can show updated data after the tap)
- TASK-022 / TASK-030 (session / client)
- Optional: token persistence may start in M9, but e2e is after 034

## Requirements

- Permission flow.
- Token registration behind an application-owned boundary.
- Handle doctor-change notifications only for this MVP (not a generic reminder platform).
- Copy is product/chrome text, not medical recommendations.
- ProductEvent must not store notification body medical text. Ids only if an event is warranted.
- No app-generated urgent medical alerts (“seek emergency care”).

## Out of scope

- Daily task / diary reminder campaigns unless a later clinic decision adds them
- Emergency medical conclusions
- Using notification copy as a channel for clinical instructions
- Implementing clinic send logic inside this React Native repository (other repo / backend)

## Expected files or areas affected

- Application-owned notifications port
- App config / credentials as required by Expo SDK 57 push docs
- Copy catalog for non-diagnostic titles/bodies
- Other repo: send triggers on assignment / appointment / completion writes

## New dependencies

Unknown until Plan Mode (`expo-notifications` is the likely Expo path). Justify then.

## Plan Mode

Yes — **required** before implementation.

## Acceptance criteria

- A clinic-side change to assignment, appointment, or completion (from TASK-034) can result in a patient notification in a configured environment.
- Notification text contains no diagnosis, no medical instruction payload, and no diary/photo content.
- Denied permission: app remains usable; data still updates on open via sync.
- The application remains runnable.

## Verification

Defined in Plan Mode. At minimum `tsc`, lint, both platforms, plus a doctor-change path against clinic-review writes.
