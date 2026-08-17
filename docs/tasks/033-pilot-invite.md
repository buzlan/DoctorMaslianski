# TASK-033 — Pilot invite and activation

Status: NOT STARTED

Milestone: M10 — Pilot access

[TASK-024](024-invite-deep-links.md) is an alias of this task. **Do not implement TASK-024 separately.**

## Goal

Closed-pilot access: clinic-issued invite code (deep links optional). On activation:

- Assign **protocol kind + version** and copy an **immutable snapshot** onto the Treatment
- Assign **pilot cohort**: `internal_dry_run` | `closed_beta` | `clinic_pilot`
- Record **privacy acceptance timestamp**, **pilot participation consent timestamp**, and **consent/privacy document version**

Exact legal copy and UX are finalized in TASK-038. This task must still **persist** the consent state. TASK-038 artifacts must match the document version recorded here before Phase 2.

## Why this task is needed

Real patients must not ship with a baked-in mock user. Internal testers must be labelled so they do not contaminate real-patient metrics.

## Dependencies

- TASK-029 schema
- TASK-022 session
- TASK-026 / TASK-005 protocol versions

## Requirements

- Invalid/expired invite fails safely in Russian.
- One active treatment.
- Cohort is assigned at invite, copied onto Patient, Treatment, and subsequent ProductEvents. It is not inferred from the device.
- ProductEvent `patient_invited` (clinic tool) and `patient_activated` with protocol kind, version, and cohort — no clinical payloads.
- Universal Links / App Links are optional if the code flow is enough.

## Out of scope

- Implementing maslianski.by except a documented link format
- Silent rewrite of an existing treatment when a new protocol version is published
- Inventing eligibility (clinic decides sclerotherapy vs telangiectasia)

## Expected files or areas affected

- Onboarding / invite screens
- Patient + Treatment assignment
- Copy catalog

## New dependencies

Unknown until Plan Mode (`expo-linking` already present; scheme `doctormaslianski` exists).

## Plan Mode

Yes.

## Acceptance criteria

- Invite activates a patient onto a specific protocol version snapshot.
- Consent fields and cohort are stored.
- Internal dry-run cohort is distinguishable.
- The application remains runnable.

## Verification

Defined in Plan Mode. At minimum `tsc`, lint, both platforms, plus a failed-invite path.
