# TASK-004 — Treatment domain models and test harness

Status: NOT STARTED

Milestone: M2 — Treatment Domain

## Goal

Pure TypeScript models and functions for Patient, Treatment, TreatmentStage, TreatmentTask, and status. Introduce Jest because domain logic is now testable.

## Why this task is needed

“What should I do today?” and Timeline must share one domain, not screen-local shapes.

## Dependencies

- TASK-003 (keeps sequence linear; this task does not need tabs)

## Requirements

- `src/modules/treatment/domain/` (only this module).
- Stage kinds aligned with PROJECT.md, as data, not hardcoded UI:
  - consultation
  - ultrasound
  - diagnosis
  - preparation
  - procedure
  - day 1 / day 3 / day 7
  - month 1 / month 3
  - follow-up
- Pure helpers: current stage, tasks for a calendar date, progress summary.
- No medical thresholds — only protocol data already on the model.
- Jest via Expo’s current unit-testing setup: https://docs.expo.dev/versions/v57.0.0/develop/unit-testing/
- Tests next to domain files.

## Out of scope

- Repository
- Mock JSON / fixtures
- React UI
- Persistence
- Diagnosing, prescribing, or changing treatment
- Environment configuration
- Backend

## Expected files or areas affected

- `src/modules/treatment/domain/**`
- `package.json` scripts
- Jest config

## New dependencies

Yes — only the Expo-recommended test runner packages.

## Plan Mode

Yes (first product module and first dependency since foundation).

## Acceptance criteria

- Types and tested helpers exist.
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
