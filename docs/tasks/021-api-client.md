# TASK-021 — Environment config and API client

Status: NOT STARTED (coarse placeholder)

Milestone: M9 — Backend Integration

This task is **intentionally coarse**. It is not an implementation spec.

Backend contracts do not exist yet. **Do not implement this task from this file alone.**

Before implementation:

1. Re-enter Plan Mode against the real API contract.
2. Split into smaller tasks if this placeholder is still too large (for example env vs client vs error mapping).
3. Do not treat the bullets below as frozen file lists or dependency choices.

Do not start this work before the local companion is useful. Environment configuration belongs here, not in M1.

## Goal (coarse)

Introduce env/base URL configuration and an HTTP client when a real API boundary exists — the first justified moment for environment configuration.

## Why this task is needed

M1 must not speculate on env files. Networking needs a concrete backend.

## Dependencies

- TASK-020 (local product complete enough)
- Enough backend contract to plan against

## Out of scope until re-planned

- Replacing mock repositories
- Auth UI
- Logging PII
- Inventing endpoints

## Expected files or areas affected

Unknown until re-plan. `src/core` is a likely home for env and HTTP client if that still matches architecture rules.

## New dependencies

Unknown until re-plan (fetch may be enough).

## Plan Mode

Yes — **required re-plan**, not a rubber stamp of this backlog text.

## Acceptance criteria (indicative)

Final criteria come from the re-plan.

Indicative:

- Debug/prod base URL pattern exists.
- The app still runs on mocks until later swap tasks.
- The application remains runnable.

## Verification

Defined in the re-plan. At minimum:

```bash
npx tsc --noEmit
npm run lint
```

Both platforms launch.
