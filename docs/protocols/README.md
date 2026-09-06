# Pilot clinic content intake

This directory is the clinic-authored, versioned source of truth for **Pilot MVP sclerotherapy content**.

The Pilot MVP has **one** treatment context: sclerotherapy. Telangiectasia / spider veins is **not** a separate protocol or product path.

These files are documentation intake records. They are not executable fixtures. TASK-041 owns mock/executable fixtures under `src/`.

Missing fields are **not** medical advice. They must not be shown as patient instructions. Fixtures must not copy intake markers into patient-facing fields.

Engineering does **not** invent:

- action catalog items or their instructions
- treatment milestone / visit labels
- timing
- recommendations
- restrictions
- diary meaning or thresholds
- photo capture medical notes
- control visit schedule
- medical thresholds
- warning rules
- compression duration
- walking targets
- medication instructions
- any other treatment instructions

If a value is clinical and has not been supplied **and approved** by the clinic, leave it marked as missing. Do not guess.

A doctor-supplied document may be used as **source material**. It remains draft until the clinic explicitly approves it for patient-facing use. Do not copy unapproved text into the app.

There is no protocol SaaS / editor in this MVP. The doctor assigns catalog items to a patient with date ranges; that assignment lives on the treatment, not as a second protocol variant.

## Records in this directory

| File | role | version | status |
| --- | --- | --- | --- |
| [sclerotherapy-v1.md](sclerotherapy-v1.md) | sclerotherapy content set / action catalog | 1 | `draft` |
| [telangiectasia-v1.md](telangiectasia-v1.md) | **not a Pilot MVP path** (kept for TASK-026 history) | 1 | `draft` — superseded as a product path |

## Identity fields

The sclerotherapy content record repeats these fields in its header.

| Field | Meaning |
| --- | --- |
| `kind` | `sclerotherapy` only for assignable Pilot MVP content. Code identifiers stay English. |
| `version` | Monotonic integer for **clinic content** records. Version 1 is the first sclerotherapy content record. This is **not** a frozen patient journey and is **not** ProductEvent `protocolVersion`. |
| `status` | Content-record status, not app runtime status. See below. |
| `source` | Clinic / doctor. Owner: Doctor Maslianski clinic. Engineering owns structure only. |
| `patientFacingLanguage` | Russian. Patient-facing values remain empty until the clinic supplies **and approves** them. |
| `contentBoundary` | Engineering did not invent clinical values. |

### Status

| Status | Meaning |
| --- | --- |
| `draft` | Engineering structure and/or unapproved source material. Not assignable to patients as clinical truth. |
| `pending clinic confirmation` | Handed to the clinic. Still not approved. |
| `approved` | Clinic confirmed this version. Only then is it source content for real-patient assignment. |

The current sclerotherapy v1 record ships as **`draft`**. Clinic approval is a later action, not an engineering decision.

Content-record `status` is the assignability flag. Each clinical section also has a **Content status** line (`TBD by clinic` / `pending clinic confirmation` / `confirmed by clinic`) so a later clinic review can confirm one section without implying the whole record is approved.

## Missing clinical content

Use these markers whenever a value would be medical and the clinic has not supplied it:

- `TBD by clinic`
- `pending clinic confirmation`
- `placeholder structure only`

These markers belong in intake documentation only.

Do **not**:

- treat them as patient instructions
- copy them into patient-facing UI
- copy them into patient-facing executable fixture fields (titles, instructions, questions, restriction text, appointment labels)

If a field is ambiguous (clinical vs structural), leave it TBD rather than guessing.

## Versioning

Clinic content version governance is owned by content **status** and **real-patient assignment**. Test/mock data does not govern versions.

Patient isolation is **not** “freeze a protocol snapshot on Treatment”. Patient isolation is: assignments, completions, periods, milestones, diary entries, photos, and appointment history are explicit records. Catalog edits do not rewrite existing assignment wording unless the doctor updates that assignment. Historical records are not deleted when the schedule changes.

Rules:

1. While a content version is `draft` and has never been approved or assigned to a real patient, the clinic may edit that draft **in place** (same file, same version number).
2. Once a version is `approved`, later clinical content changes create a **new monotonic version** (new file), not a mutation of the approved version.
3. Once actions from a version have been assigned to a real patient, those **ActionAssignment** rows (and their completions) keep their history. Later catalog versions do not rewrite that history.
4. Test/mock data created by TASK-005 / TASK-041 does **not** freeze clinic content version and does not force a new version.

File naming for assignable content: `sclerotherapy-v{version}.md`. After approval, later clinical edits become `sclerotherapy-v2.md`, and so on.

Do not add new telangiectasia content records for this MVP.

## Canonical record template (sclerotherapy)

The sclerotherapy file follows this structure.

```markdown
# Sclerotherapy content: v{version}

Content in this file is clinic-authored or explicitly marked as missing.
Missing fields are not medical advice. Do not treat placeholder structure as
treatment instructions. Do not copy intake markers into patient-facing fixtures.

## Identity

- kind: sclerotherapy
- version:
- status:
- source:
- owner:
- patientFacingLanguage:
- contentBoundary:

## Versioning

Restate the versioning rules for this record.

## Action catalog

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

| id | title | instruction |
| --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic |

Do not invent daily actions. The doctor assigns catalog items to a patient with start/end civil dates.

## Treatment milestones / visits

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

| id | kind | title |
| --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic |

Do not invent a fixed mock such as Preparation → Procedure → Day 1 → Day 7 → Control.

## Standing diary (active treatment)

Clinic-confirmed structure for the Pilot MVP (still not approved patient copy beyond the field names agreed with the clinic):

- once per civil date during the entire active treatment
- pain: VAS 0–10
- swelling: VAS 0–10
- general wellbeing: Лучше / Без изменений / Хуже

Do not infer clinical meaning or thresholds.

## Patient photos

- uploaded from Today
- maximum 3 per calendar day
- no patient gallery of own photos
- clinic reviews them

Do not invent capture medical notes.

## Doctor milestone photos

- doctor uploads and attaches to a visit / milestone
- patient views them from Treatment

## Appointment

Doctor sets the next appointment date/time and may change it later.
History is superseded, not silently destroyed.

## Other clinic-authored instructions

Content status: TBD by clinic.

Empty until the clinic supplies and approves rows. Do not invent instructions.

## Unresolved / missing fields

Checklist of every clinical section still TBD.
```

Do not fill `title` or other clinical fields with guessed labels such as “Day 1” or “Compression period”.

## Candidate questions (historical, not catalog data)

Earlier drafts proposed additional diary dimensions (heaviness, itching, burning, vs previous day). The clinic confirmed pain VAS, swelling VAS, and categorical wellbeing for the Pilot MVP. Extra dimensions stay out of catalog/diary data unless the clinic later approves them.

## What TASK-041 may safely derive

TASK-041 may take **shapes and rules** from these records and from [docs/domain-model.md](../domain-model.md), not unapproved clinical values:

- one treatment context: sclerotherapy
- ActionCatalog containers with optional/empty items
- Treatment, TreatmentPeriod, TreatmentMilestone, ActionAssignment, ActionCompletion
- standing diary field shapes
- distinct PatientPhoto vs DoctorMilestonePhoto
- Appointment with supersede history
- helpers compute today’s assignments from civil-date ranges

TASK-041 must not:

- restore telangiectasia as a second protocol path
- copy TBD strings into domain defaults
- invent medical thresholds
- reinterpret ProductEvent `protocolVersion` as catalog version

## What TASK-005 already did (historical)

TASK-005 created two empty `PilotProtocol` fixtures (sclerotherapy and telangiectasia) and snapshot assignment. That model is **superseded**. Do not extend it in TASK-007. TASK-041 replaces fixtures with the patient-specific model. Until clinic-approved catalog text exists, executable fixtures keep empty or non-clinical structural collections.
