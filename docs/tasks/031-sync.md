# TASK-031 — Remote repositories and offline sync

Status: DONE

Milestone: M9 — Supabase + sync

[TASK-023](023-remote-repositories.md) is an alias of this task. **Do not implement TASK-023 separately.**

## Goal

HTTP/Supabase implementations behind existing ports: treatment (assignments, periods, milestones, completions), diary, photos metadata (both kinds), appointments, feedback, ProductEvent flush. Offline queue where practical.

Doctor-side schedule changes must apply on the device **without deleting** historical completions, diary entries, photos, periods, visits, or superseded appointments.

## Why this task is needed

Clinic review and real patients need shared data. Completions and events must not live only on one phone. The doctor can change assignments and the appointment after invite.

## Dependencies

- TASK-022 (session)
- TASK-030
- TASK-029 schema

## Requirements

- Swap mocks behind existing repository ports.
- Queue writes while offline; retry on reconnect.
- Flush ProductEvents **without** clinical payloads and without revived snapshot `protocolVersion` semantics.
- Treatment sync sends/receives patient-specific records (assignments, periods, milestones, current appointment), not “latest protocol snapshot”.
- The client still does not prescribe or change treatment; it applies clinic-authored schedule updates.
- Prompt visibility of doctor changes when the app is opened (push is TASK-025 after TASK-034). Open-app Realtime invalidation is separate from push and does not replace this fallback.

## Out of scope

- Photo file upload (TASK-032)
- Invite UX (TASK-033)
- Building backend in this RN repo
- End-to-end push (TASK-025)
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
- Doctor-side assignment/appointment updates appear without wiping history.
- Offline retry path exists for core writes.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

Manual sync and airplane-mode retry on both platforms.
