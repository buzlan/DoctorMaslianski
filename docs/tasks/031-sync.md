# TASK-031 — Remote repositories and offline sync

Status: NOT STARTED

Milestone: M9 — Supabase + sync

[TASK-023](023-remote-repositories.md) is an alias of this task. **Do not implement TASK-023 separately.**

## Goal

HTTP/Supabase implementations behind existing ports: treatment, tasks, check-ins, photos metadata, appointments, feedback, ProductEvent flush. Offline queue where practical.

## Why this task is needed

Clinic review and real patients need shared data. Completions and events must not live only on one phone.

## Dependencies

- TASK-022 (session)
- TASK-030
- TASK-029 schema

## Requirements

- Swap mocks behind existing repository ports.
- Queue writes while offline; retry on reconnect.
- Flush ProductEvents **without** clinical payloads.
- Treatment sync must send/receive **protocol version + snapshot**, not “latest protocol”.
- The client still does not prescribe or change treatment.

## Out of scope

- Photo file upload (TASK-032)
- Invite UX (TASK-033)
- Building backend in this RN repo
- State library unless Plan Mode proves need

## Expected files or areas affected

- Module infrastructure (treatment, diary, photos, events)
- Composition root

## New dependencies

Only if Plan Mode shows need beyond TASK-030.

## Plan Mode

Yes.

## Acceptance criteria

- Today/Timeline/Diary/photos metadata/feedback work against Supabase in a configured env.
- Snapshot isolation preserved.
- Offline retry path exists for core writes.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Manual sync and airplane-mode retry on both platforms.
