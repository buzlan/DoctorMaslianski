# TASK-033 — Pilot invite and activation

Status: NOT STARTED

Milestone: M10 — Pilot access

[TASK-024](024-invite-deep-links.md) is an alias of this task. **Do not implement TASK-024 separately.**

## Goal

Closed-pilot access: clinic-issued invite code or QR. The QR / link contains **only a secure invite token**, not medical data.

On activation:

- Load the already-assigned patient treatment: current period, selected action assignments with date ranges, next appointment
- Assign **pilot cohort**: `internal_dry_run` | `closed_beta` | `clinic_pilot`
- Record **privacy acceptance timestamp**, **pilot participation consent timestamp**, and **consent/privacy document version**

Exact legal copy and UX are finalized in TASK-038. This task must still **persist** the consent state. TASK-038 artifacts must match the document version recorded here before Phase 2.

## Why this task is needed

Real patients must not ship with a baked-in mock user. Internal testers must be labelled so they do not contaminate real-patient metrics. Medical data must not be embedded in the QR.

## Dependencies

- TASK-029 schema
- TASK-022 session
- Clinic-side patient + assignment creation (contract with TASK-034; mock invite payload is acceptable until 034 exists)

## Requirements

- Invalid/expired invite fails safely in Russian.
- One active treatment.
- Cohort is assigned at invite, copied onto Patient, Treatment, and subsequent ProductEvents. It is not inferred from the device.
- ProductEvent `patient_invited` (clinic tool) and `patient_activated` with cohort — no clinical payloads, no medical data in the token, no superseded protocol snapshot context.
- Universal Links / App Links are optional if the code flow is enough.
- Push token registration may be prepared here or in TASK-025; e2e push still waits for TASK-034.

## Out of scope

- Implementing maslianski.by except a documented link format
- Silent rewrite of historical assignments when catalog content changes
- Inventing eligibility
- Putting treatment data in the QR
- End-to-end push (TASK-025)

## Expected files or areas affected

- Onboarding / invite screens
- Patient + Treatment activation
- Copy catalog

## New dependencies

Unknown until Plan Mode (`expo-linking` already present; scheme `doctormaslianski` exists). Possibly camera/QR scanning — justify in Plan Mode.

## Plan Mode

Yes.

## Acceptance criteria

- Invite token activates a patient onto an already-assigned sclerotherapy treatment (period, assignments, appointment).
- QR/link payload has no medical content.
- Consent fields and cohort are stored.
- Internal dry-run cohort is distinguishable.
- The application remains runnable.

## Verification

Defined in Plan Mode. At minimum `tsc`, lint, both platforms, plus a failed-invite path.
