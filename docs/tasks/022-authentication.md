# TASK-022 — Authentication infrastructure

Status: NOT STARTED (coarse placeholder)

Milestone: M9 — Backend Integration / M10 — Patient Onboarding

This task is **intentionally coarse**. It is not an implementation spec.

Backend and auth contracts do not exist yet. **Do not implement this task from this file alone.**

Before implementation:

1. Re-enter Plan Mode against the real auth contract.
2. Split into smaller tasks if this placeholder is still too large (for example secure storage vs session vs login UI).
3. Do not treat the bullets below as frozen file lists or dependency choices.

## Goal (coarse)

Session/token storage and a logged-out vs logged-in gate, shaped by the actual auth contract.

## Why this task is needed

Remote patient data cannot be fetched anonymously.

## Dependencies

- TASK-021, or whatever split the re-plan produces

## Out of scope until re-planned

- Full invite UX (TASK-024)
- Social login unless the contract requires it

## Expected files or areas affected

Unknown until re-plan. Secure storage and session handling are likely.

## New dependencies

Unknown until re-plan.

## Plan Mode

Yes — **required re-plan**.

## Acceptance criteria (indicative)

Final criteria come from the re-plan.

Indicative:

- An authenticated session is possible.
- No silent production backdoor.
- The application remains runnable.

## Verification

Defined in the re-plan.
