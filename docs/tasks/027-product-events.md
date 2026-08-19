# TASK-027 — ProductEvent domain and local sink

Status: DONE

Milestone: M3 — Today (port before TASK-006)

## Goal

Typed `ProductEvent` log with a local sink. Product analytics only — **not** a duplicate clinical store.

Every event must include (when known):

- `name`, `at`
- `patientId`, `treatmentId` (when applicable)
- `protocolKind` (`sclerotherapy` | `telangiectasia`)
- `protocolVersion`
- `pilotCohort` (`internal_dry_run` | `closed_beta` | `clinic_pilot`)
- optional `entityId` (task / check-in / photo **id only**)

Until invite exists, cohort may be a development default that is replaced in TASK-033.

## Why this task is needed

The pilot must measure usefulness without treating symptom values as success. Instrumentation must exist before Today emits events.

## Dependencies

- TASK-004 (ids and protocol version on the treatment)

## Requirements

Emit at least (as features land, not all in this task):

- `patient_invited` / `patient_activated` (later tasks)
- `treatment_started`
- `task_scheduled` / `task_completed`
- `checkin_requested` / `checkin_submitted` (counts only)
- `photo_checkpoint_requested` / `photo_checkpoint_completed` (counts only)
- `treatment_journey_completed`
- `feedback_submitted` (optional numeric usefulness/clarity **product** scores only)
- session/open events for return/engagement

**ProductEvent metadata must not contain:**

- raw symptom / check-in answers
- medical free text
- photo URLs or photo content
- diagnoses
- doctor notes
- feedback free text (belongs on FeedbackSurvey)

Clinical values belong on CheckIn, PhotoEntry, Treatment snapshot, and FeedbackSurvey.

Do not encode success thresholds in this module.

## Out of scope

- Supabase flush (TASK-031)
- Metrics catalog (TASK-035)
- Vendor analytics SDK unless Plan Mode proves need (prefer owned events)

## Expected files or areas affected

- Domain + local sink (treatment or a small events module)
- Tests for the privacy boundary (rejected payloads)

## New dependencies

No (default).

## Plan Mode

Yes.

## Acceptance criteria

- Events can be appended locally with required segmentation fields.
- Tests reject clinical payloads in metadata.
- The application remains runnable.
- No UI required in this task.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```
