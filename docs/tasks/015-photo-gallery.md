# TASK-015 — Photo gallery

Status: NOT STARTED

Milestone: M7 — Progress Photos

## Goal

Browse saved progress photos for the active treatment from existing surfaces (for example Diary, stage details, or a nested screen pushed from those).

**Still no Photos tab.**

## Why this task is needed

Capture without review is incomplete.

## Dependencies

- TASK-014

## Requirements

- Local gallery, associated stage/date.
- No medical comparison copy (“looks better/worse”).
- Placement decided in Plan Mode if TASK-014 did not already define it — nested in Diary and/or Treatment, not a fourth or sixth tab.

## Out of scope

- Dedicated Photos tab
- Guided capture
- AI
- Sharing

## Expected files or areas affected

- Photos presentation
- Existing routes only (plus nested stack screens if needed)

## New dependencies

No (use an existing image component if already added).

## Plan Mode

No if TASK-014 already defined gallery entry. Yes if gallery placement is still open.

## Acceptance criteria

- Photos are visible after relaunch from an existing product surface.
- Primary navigation is unchanged.
- No Photos tab.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify on iOS Simulator and Android Emulator.

Confirm there is no Photos tab.
