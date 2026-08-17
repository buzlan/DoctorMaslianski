# TASK-029 — Supabase project, schema, RLS, storage

Status: NOT STARTED

Milestone: M9 — Supabase + sync

**This work lives in a separate repository** (proposed `doctor-maslianski-pilot`), under `supabase/`. This mobile repo only documents the contract.

## Goal

Postgres schema, RLS, and Storage buckets for the Pilot MVP.

## Why this task is needed

Real-patient data cannot exist only on one phone. Schema must preserve protocol versioning, treatment snapshots, consent, and event segmentation.

## Dependencies

- Domain shapes from TASK-004 and later modules
- TASK-026 protocol kinds

## Requirements

Persist at least:

- Patient, including `pilotCohort`, `privacyAcceptedAt`, `pilotConsentAt`, `consentDocumentVersion`
- PilotProtocol (`kind`, **`version`**, content)
- Treatment (`protocolId`, **`protocolVersion`**, **immutable snapshot**, status)
- TreatmentStage / TreatmentTask as snapshot data (or equivalent JSON snapshot + completion overlay)
- CheckIn, PhotoEntry, Appointment, FeedbackSurvey
- ProductEvent with `protocolKind`, `protocolVersion`, `pilotCohort` and **without** clinical payloads

Rules:

- Editing protocol content publishes a **new version**. Existing treatments keep their snapshot.
- RLS: patients see only their rows; clinic staff role sees review data.
- Storage bucket for progress photos; URLs are not copied into ProductEvent.
- Do not invent clinical columns that are actually medical thresholds computed by the app.

## Out of scope

- Clinic review UI (TASK-034)
- Mobile client (TASK-030)
- Implementing schema inside this React Native repository

## Expected files or areas affected

- Other repo: `supabase/` migrations
- This repo: contract notes only if needed under `docs/`

## New dependencies

Supabase project (other repo). None in this app’s package.json for this task.

## Plan Mode

Yes (schema + RLS + region choice).

## Acceptance criteria

- Migrations exist in the other repo.
- Versioning, snapshot, consent, and cohort fields exist.
- RLS documented.
- This mobile app is unchanged except optional docs.

## Verification

Review migrations and RLS in the other repository.
