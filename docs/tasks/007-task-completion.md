# TASK-007 — Treatment task completion (in-memory)

Status: NOT STARTED

Milestone: M3 — Today

## Goal

The patient can mark a today’s task complete or incomplete. The UI updates without reload. State dies on process kill.

## Why this task is needed

Completing tasks is the first write path. It proves repository mutation before persistence.

Pilot MVP: completions apply to tasks on the **treatment snapshot**. Optional ProductEvent `task_completed` may include task **id** only — no clinical text.

## Dependencies

- TASK-006

## Requirements

- `completeTask` / `uncompleteTask` on the repository.
- Optimistic UI is allowed in-memory.
- No Redux, MobX, or Zustand.
- Local UI state or a thin subscribe-on-repository is enough. Document that choice in the implementation plan.
- Completing a task records patient action against a doctor-defined protocol. The app must not change the treatment plan itself.

## Out of scope

- Persistence
- Backend
- Completing tasks from Timeline, unless it falls out of the shared repository for free — do not build a second completion UX
- State management library

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
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Unit tests for repository writes.

Manually verify on iOS Simulator and Android Emulator.
