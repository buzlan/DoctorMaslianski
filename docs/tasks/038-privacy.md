# TASK-038 — Privacy disclosures, policy, and consent UX

Status: NOT STARTED

Milestone: M13 — Pilot readiness & distribution

TASK-038 must be completed before Closed Beta (Phase 2). Privacy, consent UX, health-data disclosures, and retention are a prerequisite for real-patient distribution. Public store submission is TASK-039 / M16 only.

## Goal

Privacy policy, health-data disclosures, retention notes, clinic as data controller (legal review), Supabase region choice, and the **consent/privacy document version + UX** that TASK-033 records.

The data model already requires:

- `privacyAcceptedAt`
- `pilotConsentAt`
- `consentDocumentVersion`

This task finalizes legal copy and the acceptance screens. TASK-033 must persist whatever version this task publishes.

## Why this task is needed

Real patients cannot join without recorded acceptance. This is required before Phase 2, not deferred to public store release.

## Dependencies

- TASK-033 persistence fields
- Legal / clinic review (outside engineering)

## Requirements

- Russian patient-facing notice for the closed pilot.
- Version the document; bump version if the text changes.
- Do not put medical conclusions in the privacy copy.
- ProductEvent must not store the notice text as clinical data.

## Out of scope

- Claiming clinical efficacy
- Production store submission (TASK-039)
- Inventing legal conclusions without clinic/counsel

## Expected files or areas affected

- Consent screens / copy catalog
- Hosted policy URL (clinic site or store listing)
- `consentDocumentVersion` constant

## New dependencies

No.

## Plan Mode

Yes.

## Acceptance criteria

- A versioned privacy/pilot notice exists.
- Acceptance records timestamps + version.
- Ready for Phase 2 legally as determined by the clinic.
- The application remains runnable.

## Verification

Walk through onboarding consent on iOS and Android. Confirm stored timestamps and version.
