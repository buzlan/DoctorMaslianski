# TASK-037 — TestFlight and Google Play testing tracks

Status: NOT STARTED

Milestone: M13 — Pilot readiness & distribution

## Goal

- iOS TestFlight (internal, then external/closed as needed)
- Google Play internal testing, then closed testing for Phase 2–3

Real-patient beta uses these tracks, not sideload-only.

## Why this task is needed

The MVP roadmap includes real distribution. Phase 2–3 patients need official testing tracks.

## Dependencies

- TASK-036
- TASK-038 before Phase 2 real patients (privacy/consent documents)

## Requirements

- Verify both platforms: photos, invite, sync, offline retry (as those features exist).
- Testers in Phase 1 use cohort `internal_dry_run`.
- Do not submit production App Store / Play listing in this task.

## Out of scope

- Production store release (TASK-039)
- HealthKit (post-MVP)
- Implementing push (TASK-025, after TASK-034)

## Expected files or areas affected

- Store listing drafts may start here but production metadata is TASK-039
- EAS production-like profiles for testing builds

## New dependencies

No application libraries.

## Plan Mode

Yes.

## Acceptance criteria

- A build is available on TestFlight and Play internal (or closed) testing.
- Internal vs real-patient cohorts remain distinguishable in data.

## Verification

Install from each track on iOS and Android.
