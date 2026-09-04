# TASK-007 — Treatment assignment completion (in-memory)

Status: NOT STARTED

Milestone: M3 — Today

## Goal

The patient can mark a today’s **assigned action** complete or incomplete. The UI updates without reload. State dies on process kill.

## Why this task is needed

Completing assignments is the first write path. It proves repository mutation before persistence.

Completions apply to **ActionAssignment** rows active on the current civil date, not to snapshot `ProtocolTask` ids.

Optional ProductEvent `task_completed` may include assignment **id** only — no clinical text. Do not attach superseded `protocolVersion` snapshot semantics. If events still cannot be emitted without the old protocol pair, skip the event in this task or wait for the smallest ProductEvent adaptation in TASK-041 / a later migration task. Do not reinterpret `protocolVersion` as catalog version.

## Dependencies

- TASK-006 (Today shell)
- **TASK-041** (patient-specific assignment model). Do not implement this task against the TASK-004 snapshot.

## Requirements

- `completeAssignment` / `uncompleteAssignment` (or equivalent) on the repository, writing `ActionCompletion` records.
- Optimistic UI is allowed in-memory.
- No Redux, MobX, or Zustand.
- Local UI state or a thin subscribe-on-repository is enough. Document that choice in the implementation plan.
- Completing an assignment records patient action against a doctor-selected catalog item. The app must not change the treatment plan itself.
- Disabling an assignment (later doctor/sync behavior) must not delete in-memory completions already recorded for that assignment id.

## Out of scope

- Persistence
- Backend
- Completing assignments from Timeline, unless it falls out of the shared repository for free — do not build a second completion UX
- State management library
- Domain-model replacement (TASK-041)

## Expected files or areas affected

- Treatment infrastructure
- Today presentation
- Optional small Button primitive in `src/shared/ui` if still missing

## New dependencies

No.

## Plan Mode

Yes (first write path / state).

## Acceptance criteria

- Toggle survives tab switch to Treatment and back during the same session.
- Completions are lost after restart (until TASK-010).
- Completions are keyed to assignment ids, not snapshot task ids.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Unit tests for repository writes, including that a completion remains if the assignment is later disabled in memory.

Manually verify on iOS Simulator and Android Emulator.
