# TASK-024 — Patient invite, activation, and deep links

Status: NOT STARTED (coarse placeholder)

Milestone: M10 — Patient Onboarding

This task is **intentionally coarse**. It is not an implementation spec.

Invite and linking contracts do not exist yet. **Do not implement this task from this file alone.**

Before implementation:

1. Re-enter Plan Mode against the real invite/activation/deep-link contract.
2. Split into smaller tasks if this placeholder is still too large (for example invite vs links vs recovery).
3. Do not treat the bullets below as frozen file lists or dependency choices.

## Goal (coarse)

Doctor invite via QR/link; Universal Links / App Links; activation; recovery — as specified by the backend.

## Why this task is needed

Real patients will not ship with a baked-in mock user.

## Dependencies

- Re-planned auth/API tasks (not a frozen TASK-023 → TASK-024 edge)

## Out of scope until re-planned

- Implementing maslianski.by except a documented link format

## Expected files or areas affected

Unknown until re-plan. `expo-linking` is already present. The application scheme `doctormaslianski` already exists.

## New dependencies

Unknown until re-plan.

## Plan Mode

Yes — **required re-plan**.

## Acceptance criteria (indicative)

Final criteria come from the re-plan.

Indicative:

- An invite link can activate a patient.
- An invalid invite fails safely in Russian.
- The application remains runnable.

## Verification

Defined in the re-plan.
