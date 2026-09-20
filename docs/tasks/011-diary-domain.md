# TASK-011 — Symptom diary domain

Status: DONE

Milestone: M6 — Symptom Diary

## Goal

Diary model for the clinic-confirmed Pilot MVP fields. Validation is structural (required fields, allowed scales) — not medical risk cutoffs.

Fields:

- pain: VAS 0–10
- swelling: VAS 0–10
- general wellbeing: `better` | `unchanged` | `worse` (Лучше / Без изменений / Хуже)

One entry per civil date during the **entire active treatment**. After submit, that date is complete.

This is **not** a generic protocol-defined question engine and is **not** gated by a treatment snapshot.

## Why this task is needed

Domain before UI. Testable without camera or native APIs. Questions must not be hardcoded as clinical truth beyond the clinic-confirmed field set. The app must not interpret scores.

## Dependencies

- TASK-010 (reuse persistence if it still fits; otherwise in-memory until TASK-012)
- Standing diary rules from [docs/domain-model.md](../domain-model.md) and [docs/protocols/sclerotherapy-v1.md](../protocols/sclerotherapy-v1.md)

## Requirements

- `src/modules/diary/domain`
- Structural validation only.
- The app must not interpret scores as diagnosis or emergency.
- Clinical answer values belong on `DiaryEntry`, never on `ProductEvent` metadata.

Persistence in this task is in-memory only. Diary answers are not stored in AsyncStorage or the assignment completion overlay. Local-at-rest handling is a separate TASK-012 decision.

## Out of scope

- UI
- Submission networking
- Notifications
- Medical risk thresholds
- Emergency conclusions
- Extra dimensions (heaviness, itching, burning, vs previous day) unless the clinic later approves them
- Inventing diary meaning

## Expected files or areas affected

- `src/modules/diary/**` domain and tests

## New dependencies

No.

## Plan Mode

Yes (new module).

## Acceptance criteria

- A validated diary entry object exists against the confirmed field set.
- A second submit for the same civil date is rejected or treated as already complete.
- Unit tests pass.
- No UI is required.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```
