# TASK-034 — Minimal clinic review (separate repository)

Status: NOT STARTED

Milestone: M11 — Clinic review

**Do not put this web app in the React Native repository.**

Proposed other repo: `doctor-maslianski-pilot` (`clinic-review/` + `supabase/`).

This mobile repo only documents the contract.

## Goal

Minimal **read-mostly** review tool:

Patients → Patient → treatment timeline → task completion → check-ins → photos → feedback

Plus one justified write: **Invite patient + assign a specific protocol version + cohort** (copies an immutable snapshot).

## Why this task is needed

Clinic staff must review structured follow-up. This is not a doctor SaaS.

## Dependencies

- TASK-029
- Invite path compatible with TASK-033

## Requirements

- Show which protocol **version** the patient is on.
- Publishing a new protocol version must **not** silently rewrite existing treatments.
- Staff auth: clinic-only allowlist. Not patient-facing.
- Optional staff tally for routine clarification contacts (for TASK-035). Do not infer this from the phone.
- No protocol editor SaaS, chat, billing, or multi-clinic admin.

## Out of scope

- Forcing web code into `DoctorMaslianski`
- Full doctor management platform
- Diagnosing patients in the review UI

## Expected files or areas affected

- Other repository only
- Optional contract notes under `docs/` in this repo

## New dependencies

Chosen in the other repo’s Plan Mode. None in this app’s package.json.

## Plan Mode

Yes (in the other repository).

## Acceptance criteria

- Clinic can list patients and open timeline, tasks, check-ins, photos, feedback.
- Invite assigns version + snapshot + cohort.
- Existing treatments keep their snapshot after a new protocol version is published.
- This RN app is unchanged except docs.

## Verification

Performed in the other repository.
