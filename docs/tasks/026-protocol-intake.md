# TASK-026 — Clinic protocol intake

Status: DONE

Milestone: M2 — Pilot domain

## Goal

Capture clinic-authored content for the two Pilot MVP protocols as **versioned data**:

- sclerotherapy
- telangiectasias / spider veins

Engineering does **not** invent stages, recommendations, timing, tasks, check-in questions, photo checkpoints, restrictions, or medical thresholds.

## Why this task is needed

Fixtures and the domain snapshot must reflect doctor/clinic protocol, not a generic phlebology list from older docs.

## Dependencies

- TASK-003 (sequence only)
- Clinic / doctor as the content source

## Requirements

- Document each protocol as data (markdown and/or structured JSON/TypeScript later consumed by TASK-005).
- Each protocol has `kind` and a monotonic **`version`** (start at version 1).
- Later clinic edits are a **new version**. Do not mutate a version that will be assigned to patients.
- Include, as provided by the clinic: stages, tasks, check-in question defs, photo checkpoints, restrictions, control appointment pattern.
- Proposed check-in dimensions (pain, swelling, heaviness, itching, burning, vs previous day) may be shown to the clinic as a draft. If the clinic specifies different questions, follow the clinic.
- Label any missing content as placeholder, not as medical advice.

## Out of scope

- Application UI
- Inventing clinical protocols
- Mutating assigned treatments when content changes (that is a new version; snapshots are TASK-004/005)
- HealthKit / other procedures

## Expected files or areas affected

- `docs/` protocol intake notes and/or structured fixture source under `docs/` or `src/modules/treatment` fixtures in TASK-005
- This task may be documentation-only until TASK-005 consumes it

## New dependencies

No.

## Plan Mode

Yes (content boundary with the clinic).

## Acceptance criteria

- Two versioned protocol records exist as data (even if some fields are labelled placeholders pending clinic).
- Versioning rule is documented: new edit → new version.
- No clinical content is presented as invented by engineering.
- The application remains runnable (no requirement to change UI).

## Verification

Review the intake artifacts with the clinic when available.

```bash
npx tsc --noEmit
```

Only if TypeScript fixtures were added.
