# TASK-041 — Patient-specific treatment domain

Status: DONE

Milestone: M2 — Pilot domain (code follow-on after TASK-040)

## Goal

Replace the shipped `PilotProtocol` / `TreatmentSnapshot` / `ProtocolStage` / `ProtocolTask` product model in TypeScript with patient-specific assignments, treatment periods, and milestones, as specified in [docs/domain-model.md](../domain-model.md).

Adapt the Today **read** model so it lists assignments active on the current civil date (and current period Day N if shown). Do **not** implement completion UI (TASK-007).

## Why this task is needed

TASK-040 aligned documentation. Current `src/modules/treatment` still implements the superseded snapshot model. TASK-007 must write `ActionCompletion` records against assignments, not snapshot task ids.

## Dependencies

- TASK-040

## Requirements

- Evolve types and helpers in `src/modules/treatment/domain` to match `docs/domain-model.md`.
- Keep `CalendarDate`, repository port, Today application/presentation split, ProductEvent privacy boundary, and tests.
- One sclerotherapy treatment context. Remove telangiectasia as a selectable protocol path from fixtures.
- Fixtures may be structurally populated for development (period, empty or non-clinical assignment shells) but must **not** copy unapproved clinical instructions or intake markers into patient-facing fields.
- Today still loads: empty-actions and no-active-treatment states remain valid.
- ProductEvent: the old `protocolKind` / `protocolVersion` snapshot context is **superseded**. Do **not** reinterpret `protocolVersion` as action-catalog version. If this task’s code still emits events, either stop attaching the misleading pair or perform the **smallest** schema adaptation required by that code (ids + cohort, sclerotherapy context if needed). Prefer a later explicit event-migration task if the change would churn TASK-027 tests without a read/write need. Do not preserve misleading semantics just for compatibility.
- No global state library. No backend.

## Out of scope

- Completing assignments in the UI (TASK-007)
- Treatment timeline UI (TASK-008)
- Persistence (TASK-010)
- Diary UI (TASK-012)
- Photo capture (TASK-014 / TASK-015)
- Push notifications (TASK-025)
- Inventing clinic-approved action catalog text
- Protocol SaaS / editor
- Rewriting DONE task files

## Expected files or areas affected

- `src/modules/treatment/domain/**`
- `src/modules/treatment/infrastructure/**` (fixtures, in-memory repository)
- `src/modules/today/application/**` (read model)
- ProductEvent types/tests only if this task’s emits require the smallest schema adaptation

## New dependencies

No.

## Plan Mode

Yes (domain model replacement).

## Acceptance criteria

- Domain types express Treatment, TreatmentPeriod, TreatmentMilestone, ActionAssignment, ActionCompletion overlay (even if writes land in TASK-007).
- Helpers derive today’s assignments from civil-date ranges and `active` status, not snapshot `dayOffsets`.
- Day N is 1-based from the current period start.
- Telangiectasia is not a second fixture protocol path.
- Today remains runnable (read-only aside from existing optional ProductEvents).
- `npx tsc --noEmit`, `npm run lint`, and `npm test` pass.
- The app does not diagnose, prescribe, change treatment, or invent medical thresholds.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Manually verify the Today screen still loads on iOS Simulator and Android Emulator.
