# TASK-004 — Treatment domain models and test harness

Status: DONE

Milestone: M2 — Pilot domain

## Goal

Pure TypeScript models and functions for the Pilot MVP domain. Introduce Jest because domain logic is now testable.

Models:

- Patient (including fields for later cohort and consent; values may be unset until TASK-033)
- PilotProtocol (`kind`: sclerotherapy | telangiectasia; **`version`** monotonic)
- Treatment (`protocolId`, **`protocolVersion`**, **immutable protocol snapshot**, start date, status)
- TreatmentStage (from the **snapshot**, not from the latest clinic protocol)
- TreatmentTask
- status helpers

## Why this task is needed

Today and Timeline must share one domain. Protocol versioning must exist before fixtures and assignments so later clinic edits cannot silently change an in-flight journey.

## Dependencies

- TASK-003 (sequence)
- TASK-026 (clinic-authored protocol content for realistic shapes; domain types can land in parallel but must not invent clinical field values)

## Requirements

- `src/modules/treatment/domain/` (only this module in this task).
- Models are generic containers. **Do not** hardcode the old generic phlebology stage list (consultation, ultrasound, EVLT, month 3, …) as a product requirement.
- `PilotProtocol.version` is required. Editing clinic content is a **new version**, not a mutation of a version that already has treatments.
- Assigning a treatment copies an **immutable snapshot** of that protocol version (stages, tasks, check-in defs, photo checkpoints, restrictions, appointments as data).
- Pure helpers: current stage, tasks for a calendar date, progress summary — computed from the **snapshot**.
- No medical thresholds in code — only protocol data already on the snapshot.
- Jest via Expo’s current unit-testing setup: https://docs.expo.dev/versions/v57.0.0/develop/unit-testing/
- Tests next to domain files, including: snapshot is independent of a later protocol version change.

## Out of scope

- Repository
- Mock JSON / fixtures (TASK-005)
- React UI
- Persistence
- Diagnosing, prescribing, or changing treatment
- Inventing clinical protocol content
- Environment configuration
- Backend
- ProductEvent implementation (TASK-027)

## Expected files or areas affected

- `src/modules/treatment/domain/**`
- `package.json` scripts
- Jest config

## New dependencies

Yes — only the Expo-recommended test runner packages.

## Plan Mode

Yes (first product module, versioning/snapshot rules, first dependency since foundation).

## Acceptance criteria

- Types and tested helpers exist, including protocol version + treatment snapshot.
- Changing a protocol fixture version does not alter an already constructed Treatment snapshot in tests.
- No UI change is required.
- `npm test` (or the agreed test script) passes.
- The application remains runnable.
- The app does not diagnose, prescribe, change treatment, or invent medical thresholds.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```
