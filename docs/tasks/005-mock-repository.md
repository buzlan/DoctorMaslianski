# TASK-005 — Mock treatment repository and fixtures

Status: NOT STARTED

Milestone: M2 — Treatment Domain

## Goal

One in-memory `TreatmentRepository` with a realistic phlebology fixture (one patient, one active treatment). App-facing contract that a future HTTP implementation can match.

## Why this task is needed

Today and Timeline must not import fixture objects directly.

## Dependencies

- TASK-004

## Requirements

- `getActiveTreatment()` and the minimal reads needed by later Today/Timeline tasks.
- Singleton or composition-root instance so Today and Timeline share mutations later.
- Fixture includes doctor-defined tasks, recommendations, and optional symptom check-in, photo request, step target, and appointment — as protocol fields, not app-invented advice.
- Doctor-defined protocol text in mock data is Russian (patients see it).
- No backend.

## Out of scope

- HTTP
- Writes, unless a tiny in-memory complete-task is easier to add in TASK-007
- Authentication
- Extra modules
- Environment configuration

## Expected files or areas affected

- `src/modules/treatment/infrastructure/**`
- Fixture data

## New dependencies

No.

## Plan Mode

Yes (data-access boundary).

## Acceptance criteria

- Repository returns a coherent treatment.
- Unit tests cover the mock.
- UI is still placeholders.
- The application remains runnable.
- Recommendations and thresholds in the fixture originate from the mock protocol, not from app logic.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```
