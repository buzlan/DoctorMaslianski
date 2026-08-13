# TASK-023 — Remote repositories

Status: NOT STARTED (coarse placeholder)

Milestone: M9 — Backend Integration

This task is **intentionally coarse**. It is not an implementation spec.

API contracts do not exist yet. **Do not implement this task from this file alone.**

Before implementation:

1. Re-enter Plan Mode against the real resource endpoints.
2. Split into smaller tasks if this placeholder is still too large (for example treatment vs diary vs uploads).
3. Do not treat the bullets below as frozen file lists or dependency choices.

## Goal (coarse)

HTTP implementations behind existing ports (treatment, tasks, diary, photos upload, appointments) once endpoints exist.

## Why this task is needed

Doctor review in the real patient journey needs a backend.

## Dependencies

- TASK-022, or the re-planned auth/API split

## Out of scope until re-planned

- Building the backend in this repository
- Doctor web application
- The client prescribing or changing treatment

## Expected files or areas affected

Unknown until re-plan. Existing module ports are the likely swap points.

## New dependencies

Unknown until re-plan.

## Plan Mode

Yes — **required re-plan**.

## Acceptance criteria (indicative)

Final criteria come from the re-plan.

Indicative:

- Product screens can run against a configured API.
- The client still does not prescribe or change treatment.
- The application remains runnable.

## Verification

Defined in the re-plan.
