# TASK-005 — Mock treatment repository and fixtures

Status: NOT STARTED

Milestone: M2 — Pilot domain

## Goal

One in-memory `TreatmentRepository` with **two versioned** pilot protocol fixtures (sclerotherapy, telangiectasia) after TASK-026. One patient, one active treatment. Assigning a treatment **snapshots** the chosen protocol version.

## Why this task is needed

Today and Timeline must not import fixture objects directly. Fixtures must demonstrate versioning so later protocol edits cannot rewrite an assigned journey.

## Dependencies

- TASK-004
- TASK-026 (clinic-authored content; until the clinic delivers text, use clearly marked placeholders that are not presented as medical advice invented by engineering)

## Requirements

- `getActiveTreatment()` and the minimal reads needed by later Today/Timeline tasks.
- Singleton or composition-root instance so Today and Timeline share mutations later.
- Two `PilotProtocol` records with `kind` + `version`.
- Creating the active `Treatment` copies an immutable snapshot of that version.
- Fixture content (tasks, recommendations, check-in defs, photo checkpoints, step/restriction text, appointment) comes from TASK-026, as protocol fields, not app-invented advice.
- Doctor-defined protocol text is Russian (patients see it).
- No backend.

## Out of scope

- HTTP
- Writes, unless a tiny in-memory complete-task is easier to add in TASK-007
- Authentication
- Extra modules
- Environment configuration
- Inventing clinical protocols if TASK-026 is still empty — use labelled placeholders only

## Expected files or areas affected

- `src/modules/treatment/infrastructure/**`
- Fixture data derived from TASK-026

## New dependencies

No.

## Plan Mode

Yes (data-access boundary + snapshot assignment).

## Acceptance criteria

- Repository returns a coherent treatment whose stages come from the snapshot.
- Unit tests cover the mock and snapshot isolation from a newer protocol version.
- UI is still placeholders.
- The application remains runnable.
- Recommendations and thresholds in the fixture originate from the (placeholder or clinic) protocol, not from app logic.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```
