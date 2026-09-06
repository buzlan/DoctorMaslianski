# TASK-013 — Symptom history

Status: DONE

Milestone: M6 — Symptom Diary

## Goal

Chronological history of submitted diary entries.

## Why this task is needed

Diary is incomplete without looking back.

## Dependencies

- TASK-012

## Requirements

- Read-only list in Diary of submitted `DiaryEntry` rows.
- No charts unless trivial.
- No trend-based medical conclusions.
- Do not copy raw answers into ProductEvent metadata.

## Out of scope

- Analytics
- Export
- Doctor comments
- Diagnosing from history

## Expected files or areas affected

- Diary presentation

## New dependencies

No.

## Plan Mode

No, if TASK-012 already defined diary routes and storage.

## Acceptance criteria

- Past entries are visible after relaunch.
- The application remains runnable.
- History does not produce medical conclusions.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify on iOS Simulator and Android Emulator.
