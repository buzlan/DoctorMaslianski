# Pilot MVP conceptual domain model

This document specifies the **clinic-confirmed** product domain for the Pilot MVP.

It is conceptual. TypeScript types, fixtures, and Today read-model changes land in [TASK-041](tasks/041-patient-treatment-domain.md), not in TASK-040.

Engineering does **not** invent clinical catalog text, milestone labels, or medical thresholds. Clinic content stays `draft` until explicitly approved for patient-facing use. See [docs/protocols/README.md](protocols/README.md).

Code shipped in TASK-004 / TASK-005 / TASK-006 (`PilotProtocol`, `TreatmentSnapshot`, `ProtocolStage`, `ProtocolTask`) is **superseded** as the product model. Do not extend that snapshot write path in TASK-007.

## Isolation rule

Do **not** mutate historical:

- action completions
- submitted diary entries
- patient photos
- past treatment periods
- past milestones / visits
- superseded appointments

The doctor **may** change the current/future schedule:

- add, disable, or replace assignments
- start a new treatment period after a control visit
- set or change the current appointment
- attach doctor photos to a milestone
- mark treatment complete

Those schedule changes later sync from the backend. The mobile app must not invent or generate the medical plan.

Disabling an assignment must not delete its historical completions.

## Treatment context

Pilot MVP supports **one** treatment context: sclerotherapy.

Telangiectasia / spider veins is **not** a separate protocol or product path.

There is no patient-selectable protocol list and no protocol SaaS/editor.

## Entities

### Patient

Unchanged in role: identity, `pilotCohort`, privacy/consent timestamps and document version (populated in invite/privacy tasks).

### ActionCatalog (clinic content)

Predefined actions the doctor may assign. Each item has clinic-approved title and instruction **only after approval**.

The catalog is content, not a patient journey template. Catalog edits do not rewrite existing assignments’ wording unless the doctor explicitly updates that assignment.

Do not treat catalog version as a frozen patient journey, and do not reuse legacy ProductEvent `protocolVersion` to mean catalog version.

### Treatment

One active treatment per patient in the Pilot MVP.

Fields (conceptual):

- `patientId`
- `status`: `active` | `completed` | `cancelled`
- current period
- current appointment (latest non-superseded)
- assignments, milestones, diary entries, photos attached by id

No immutable protocol snapshot of stages/tasks/check-ins/photo checkpoints.

When `status` is `completed`, the patient app leaves the three-tab shell and shows a completion screen with clinic contact / booking.

### TreatmentPeriod

- `startedOn` (civil date)
- `endedOn` (civil date, absent while current)

**День N** for the current period = `1 + dayIndex(startedOn, today)`.

The initial period starts at Day 1. After a control visit, if the doctor continues treatment, the doctor starts a **new** period; Day N resets to 1. Previous periods remain in history.

### TreatmentMilestone

A clinical visit (for example procedure or control). Kinds/labels come from clinic content, not an app-invented stage list.

The old mock structure “Preparation → Procedure → Day 1 → Day 7 → Control” is **not** the product model.

The final milestone is a control visit / completion decision.

Doctor-uploaded photos attach to a milestone. The patient views them from Treatment (TASK-015 / stage-or-visit details).

### ActionAssignment

Doctor-selected catalog item for this patient:

- catalog item id
- display title/instruction copied at assignment (clinic-approved text only)
- `startDate` and `endDate` (inclusive civil dates)
- `status`: `active` | `disabled`

Today shows assignments whose range includes the current civil date and whose status is `active`.

Doctor may later add, disable, or replace an assignment. Prefer disable + new assignment over silent rewrite when the change would confuse history. Completions stay on the original assignment id.

### ActionCompletion

Patient mark-complete against an assignment on a civil date.

Historical completions are never deleted when the assignment is later disabled.

In-memory completion is TASK-007. Persistence is TASK-010.

### DiaryEntry

Standing rule during the **entire active treatment**, not a snapshot-gated question engine.

- one entry per civil date per treatment
- after submit, not offered again until the next civil date
- pain: VAS 0–10
- swelling: VAS 0–10
- general wellbeing: `better` | `unchanged` | `worse` (Лучше / Без изменений / Хуже)

The app must not infer clinical meaning or thresholds from answers.

### PatientPhoto

Uploaded by the patient from Today.

- maximum **3** per calendar day
- the patient does **not** have a gallery of their own submitted photos
- clinic/doctor can review them (TASK-034)

Distinct from doctor milestone photos.

### DoctorMilestonePhoto

Uploaded by the doctor and attached to a treatment milestone/visit.

The patient can view these from the Treatment screen (TASK-015). Distinct from patient photos.

### Appointment

Doctor sets the next appointment date/time and may change it later.

Do not silently destroy history: a change **supersedes** the previous row; the patient sees the current (latest non-superseded) appointment.

### FeedbackSurvey

Product validation (usefulness / clarity, optional free text), not a medical outcome. Shown in the completed-treatment patient state (TASK-028). Free text must not go on ProductEvent.

### ProductEvent

Product analytics, not a clinical store. Must not contain raw diary answers, medical free text, photo URLs/content, diagnoses, or doctor notes.

**Legacy context is superseded.** Events shipped around TASK-027 may include `protocolKind` (`sclerotherapy` | `telangiectasia`) and `protocolVersion`. That pair described a versioned protocol snapshot. It must **not** be reinterpreted as action-catalog version.

The smallest necessary ProductEvent schema adaptation is deferred to [TASK-041](tasks/041-patient-treatment-domain.md) or a later explicit event-migration task when code requires it. Do not preserve misleading semantics just for compatibility. Until that adaptation, do not add new events that pretend `protocolVersion` means catalog version.

Keep `pilotCohort` segmentation. Symptom values are not success metrics.

## Surfaces (while treatment is active)

Three tabs only:

1. **Сегодня (Today)** — assignments active today; complete them; diary CTA if not submitted today; patient photo upload if under the daily cap; current appointment; contact CTA.
2. **Лечение (Treatment)** — milestones/visits, current period “День N”, period history, doctor photos, current appointment.
3. **Дневник (Diary)** — daily form + submitted history (M6).

No Photos tab, no Doctor/contact tab, no Activity tab.

After doctor-marked completion: no main tabs; completion screen with clinic contact / booking.

## Later workflow (not implemented in TASK-040)

Clinic creates/opens patient, assigns current period, selected actions/date ranges, and next appointment, then generates an invite/QR that contains **only** a secure token/link. Patient activates and receives treatment data. Backend remains TASK-029+ / TASK-033.

Push notifications (TASK-025) notify the patient of doctor-side changes to assignments, appointments, and possibly treatment completion. End-to-end implementation is after clinic-review writes exist (after TASK-034). Copy stays non-diagnostic.
