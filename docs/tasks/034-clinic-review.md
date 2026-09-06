# TASK-034 — Minimal clinic review (separate repository)

Status: DONE (other repository: `doctor-maslianski-pilot` / `clinic-review`)

Milestone: M11 — Clinic review

**Do not put this web app in the React Native repository.**

Proposed other repo: `doctor-maslianski-pilot` (`clinic-review/` + `supabase/`).

This mobile repo only documents the contract.

Clinic-facing `patients.clinic_label` is not shown in this app. Mobile continues to read assignments, periods, appointments, milestones, and doctor photos from the existing remote repositories. Invite QR remains `doctormaslianski://invite/{token}` until TASK-037.

## Goal

Minimal clinic tool — **not** a protocol SaaS / editor, **not** a full doctor management platform.

Staff can:

- list patients and open a patient
- review timeline, assignment completions, diary, patient photos, doctor photos, feedback
- **write** patient-specific treatment: select catalog actions with date ranges, add/disable/change assignments, set/edit next appointment, attach photos to a milestone/visit, start a new period after a control visit, mark treatment complete
- generate invite / QR containing **only** a secure token
- assign **pilot cohort**

Historical completions, diary, photos, periods, visits, and superseded appointments must not be deleted when staff disable or change an assignment.

## Why this task is needed

The doctor controls the patient’s plan. The patient app only displays and collects. Clinic staff must both assign and review structured follow-up.

## Dependencies

- TASK-029
- Invite path compatible with TASK-033

## Requirements

- Show current period, Day N basis, assignments with date ranges, current appointment, milestones.
- Publishing new catalog content must **not** silently rewrite existing assignments.
- Staff auth: clinic-only allowlist. Not patient-facing.
- Optional staff tally for routine clarification contacts (for TASK-035). Do not infer this from the phone.
- No protocol editor SaaS, chat, billing, or multi-clinic admin.
- Patient photos (from Today) vs doctor milestone photos stay distinct.
- These writes are the prerequisite for end-to-end TASK-025 push.

## Out of scope

- Forcing web code into `DoctorMaslianski`
- Full doctor management platform
- Diagnosing patients in the review UI
- Designing a protocol editor
- Multiple selectable treatment protocols (sclerotherapy only)

## Expected files or areas affected

- Other repository only
- Optional contract notes under `docs/` in this repo

## New dependencies

Chosen in the other repo’s Plan Mode. None in this app’s package.json.

## Plan Mode

Yes (in the other repository).

## Acceptance criteria

- Clinic can list patients and open timeline, assignments, diary, both photo kinds, feedback.
- Clinic can assign/disable actions, set appointment, attach visit photos, start a new period, mark complete, and issue a token invite.
- Existing historical rows remain after those writes.
- This RN app is unchanged except docs.

## Verification

Performed in the other repository.
