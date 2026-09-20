# TASK-029 — Supabase project, schema, RLS, storage

Status: NOT STARTED

Milestone: M9 — Supabase + sync

**This work lives in a separate repository** (proposed `doctor-maslianski-pilot`), under `supabase/`. This mobile repo only documents the contract.

## Goal

Postgres schema, RLS, and Storage buckets for the Pilot MVP.

## Why this task is needed

Real-patient data cannot exist only on one phone. Schema must preserve patient-specific assignments, periods, milestones, historical completions, consent, and event segmentation — not a frozen protocol snapshot as the plan of care.

## Dependencies

- Domain shapes from TASK-041 and later modules
- TASK-040 / sclerotherapy content intake (not two protocol kinds)

## Requirements

Persist at least:

- Patient, including `pilotCohort`, `privacyAcceptedAt`, `pilotConsentAt`, `consentDocumentVersion`
- Action catalog content (sclerotherapy; draft vs approved is a clinic concern)
- Treatment (status, current period pointer; **no** immutable protocol snapshot as the plan)
- TreatmentPeriod, TreatmentMilestone, ActionAssignment, ActionCompletion
- DiaryEntry, PatientPhoto, DoctorMilestonePhoto, Appointment (with supersede history), FeedbackSurvey
- ProductEvent with `pilotCohort` and **without** clinical payloads and **without** treating legacy `protocolVersion` as catalog version

Rules:

- Catalog content edits must not rewrite historical assignments/completions.
- Disabling an assignment does not delete completions.
- Appointment changes supersede; they do not silently destroy history.
- Appointment datetime must be specified explicitly: clinic timezone, storage normalization (timestamptz vs civil wall-clock), and patient display semantics. TASK-020 displays clinic-authored ISO `at` as wall-clock date/time from the string and does not convert through the device timezone. Do not leave that mapping implicit in schema.
- Patient photos and doctor milestone photos are distinct objects / paths.
- RLS: patients see only their rows; clinic staff role sees review data and can perform assignment writes.
- Storage buckets for both photo kinds; URLs are not copied into ProductEvent.
- Do not invent clinical columns that are actually medical thresholds computed by the app.

## Out of scope

- Clinic review UI (TASK-034)
- Mobile client (TASK-030)
- Implementing schema inside this React Native repository
- End-to-end push (TASK-025); schema may store push tokens if Plan Mode for 029/025 agrees

## Expected files or areas affected

- Other repo: `supabase/` migrations
- This repo: contract notes only if needed under `docs/`

## New dependencies

Supabase project (other repo). None in this app’s package.json for this task.

## Plan Mode

Yes (schema + RLS + region choice).

## Acceptance criteria

- Migrations exist in the other repo.
- Assignments, periods, milestones, completion overlay, two photo kinds, appointment history, consent, and cohort fields exist.
- RLS documented.
- This mobile app is unchanged except optional docs.

## Verification

Review migrations and RLS in the other repository.
