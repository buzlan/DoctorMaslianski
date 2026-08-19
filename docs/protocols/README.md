# Pilot protocol intake

This directory is the clinic-authored, versioned source of truth for the two Pilot MVP protocols:

- sclerotherapy
- telangiectasias / spider veins (`kind`: `telangiectasia`)

These files are documentation intake records. They are not executable fixtures. TASK-005 owns mock/executable fixtures under `src/`.

Missing fields are **not** medical advice. They must not be shown as patient instructions. TASK-005 must not copy intake markers into patient-facing fixture fields.

Engineering does **not** invent:

- treatment stages
- timing
- tasks
- recommendations
- restrictions
- check-in questions
- photo checkpoints
- control visit schedule
- medical thresholds
- warning rules
- compression duration
- walking targets
- medication instructions
- any other treatment instructions

If a value is clinical and has not been supplied by the clinic, leave it marked as missing. Do not guess.

## Records in this directory

| File | kind | version | status |
| --- | --- | --- | --- |
| [sclerotherapy-v1.md](sclerotherapy-v1.md) | `sclerotherapy` | 1 | `draft` |
| [telangiectasia-v1.md](telangiectasia-v1.md) | `telangiectasia` | 1 | `draft` |

Display name for `telangiectasia`: telangiectasias / spider veins.

## Identity fields

Each protocol version record repeats these fields in its header.

| Field | Meaning |
| --- | --- |
| `kind` | Closed set: `sclerotherapy` \| `telangiectasia`. Code identifiers stay English. Display labels may be longer. |
| `version` | Required monotonic integer. Version 1 is the first record for that kind. |
| `status` | Protocol-version status, not app runtime status. See below. |
| `source` | Clinic / doctor. Owner: Doctor Maslianski clinic. Engineering owns structure and versioning mechanics only. |
| `patientFacingLanguage` | Russian. Patient-facing values remain empty until the clinic supplies them. |
| `contentBoundary` | Engineering did not invent clinical values. |

### Status

| Status | Meaning |
| --- | --- |
| `draft` | Engineering structure only. Not assignable to patients as clinical truth. |
| `pending clinic confirmation` | Handed to the clinic. Still not approved. |
| `approved` | Clinic confirmed this version. Only then is it source content for real-patient assignment. |

Both current v1 records ship as **`draft`**. Clinic approval is a later action, not an engineering decision.

Protocol-level `status` is the assignability flag. Each clinical section also has a **Content status** line (`TBD by clinic` / `pending clinic confirmation` / `confirmed by clinic`) so a later clinic review can confirm one section without implying the whole protocol is approved.

## Missing clinical content

Use these markers whenever a value would be medical and the clinic has not supplied it:

- `TBD by clinic`
- `pending clinic confirmation`
- `placeholder structure only`

These markers belong in intake documentation only.

Do **not**:

- treat them as patient instructions
- copy them into patient-facing UI
- copy them into patient-facing executable fixture fields in TASK-005 (titles, instructions, questions, restriction text, appointment labels)

If a field is ambiguous (clinical vs structural), leave it TBD rather than guessing.

## Versioning

Clinic protocol version governance is owned by protocol **status** and **real-patient assignment**. Test/mock snapshots do not govern versions.

Rules:

1. While a protocol version is `draft` and has never been approved or assigned to a real patient, the clinic may edit that draft **in place** (same file, same version number).
2. Once a version is `approved`, later clinical content changes create a **new monotonic version** (new file), not a mutation of the approved version.
3. Once a version has been assigned to a real patient, that Treatment keeps its **immutable assigned snapshot**. Later protocol versions do not rewrite that journey.
4. Test/mock snapshots created by TASK-005 do **not** freeze the clinic protocol version and do not force a new version.

File naming: `{kind}-v{version}.md`. After approval, later clinical edits become `sclerotherapy-v2.md`, `telangiectasia-v2.md`, and so on.

TASK-004 will later store `protocolVersion` plus an immutable snapshot on `Treatment` for assignment isolation. That contract is documented here; it is not implemented in this task.

## Canonical record template

Both protocol files follow this structure so they stay aligned.

```markdown
# Protocol: {kind} v{version}

Content in this file is clinic-authored or explicitly marked as missing.
Missing fields are not medical advice. Do not treat placeholder structure as
treatment instructions. Do not copy intake markers into patient-facing fixtures.

## Identity

- kind:
- version:
- status:
- source:
- owner:
- patientFacingLanguage:
- contentBoundary:

## Versioning

Restate the four versioning rules for this record.

## Stages

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

| id | title | summary | timingRule | order |
| --- | --- | --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic | TBD by clinic | TBD |

Do not invent stage names or day ranges.

## Tasks

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

| id | stageId | title | instruction | scheduleRule |
| --- | --- | --- | --- | --- |
| TBD | TBD | TBD by clinic | TBD by clinic | TBD by clinic |

Do not invent daily actions.

## Check-in definitions (active protocol data)

Content status: TBD by clinic.

No active check-in questions in this version. Candidate questions in
docs/protocols/README.md are not protocol data.

## Photo checkpoints

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

| id | stageId | title | when | captureNotes |
| --- | --- | --- | --- | --- |
| TBD | TBD | TBD by clinic | TBD by clinic | TBD by clinic |

Do not invent a photo schedule.

## Restrictions

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

| id | title | instruction | appliesWhen |
| --- | --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic | TBD by clinic |

Do not invent limits.

## Control appointment pattern

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

| id | label | when |
| --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic |

Do not invent visit cadence.

## Other clinic-authored instructions

Content status: TBD by clinic.

Empty until the clinic supplies rows. Do not invent instructions.

## Unresolved / missing fields

Checklist of every clinical section still TBD.
```

Do not fill `title` or other clinical fields with guessed labels such as “Day 1” or “Compression period”.

## Candidate questions for clinic review (not protocol data)

The following dimensions appeared in earlier task drafts ([TASK-011](../tasks/011-diary-domain.md), [TASK-026](../tasks/026-protocol-intake.md)). They are **unapproved product proposals**, not clinic-authored questions, and **not** active protocol data.

Do not copy them into:

- the **Check-in definitions (active protocol data)** section of a protocol record
- TASK-004 domain defaults
- TASK-005 fixture question definitions
- patient-facing UI

Until the clinic confirms questions, v1 active check-in data is none.

Candidate dimensions for clinic review only:

- pain
- swelling
- heaviness
- itching
- burning
- comparison with the previous day

If the clinic specifies different questions, follow the clinic. If the clinic rejects these, they stay out of protocol data.

## What TASK-004 may safely derive

TASK-004 may take **shapes and rules** from these records, not clinical values:

- `PilotProtocol.kind` union (`sclerotherapy` | `telangiectasia`) and required `version: number`
- nested container types with optional/empty collections: stages, tasks, check-in defs, photo checkpoints, restrictions, appointment pattern
- snapshot copy semantics: Treatment stores `protocolId`, `protocolVersion`, and an immutable snapshot
- helpers compute from the snapshot only

TASK-004 must not:

- hardcode a stage list
- copy TBD strings into domain defaults
- treat candidate questions as schema defaults
- invent medical thresholds

## What TASK-005 will later consume

TASK-005 is the first task allowed to place executable fixtures under `src/`.

It should:

- create two `PilotProtocol` fixtures whose `kind` and `version` match these v1 files
- copy only **clinic-supplied** values from the intake records
- **not** copy intake markers (`TBD by clinic`, `placeholder structure only`, `pending clinic confirmation`) into patient-facing fixture fields
- until clinic content exists, prefer **empty structural collections** (empty stages, tasks, check-in defs, photo checkpoints, restrictions, appointments) and/or **development-only fixture state** that is not presented as patient instructions
- not invent fake clinical wording to make fixtures look complete
- not promote candidate check-in questions into fixture question defs
- demonstrate snapshot isolation in tests: an already constructed Treatment snapshot is unchanged if a later protocol version object is created in the mock

That isolation test proves assignment immutability. It does **not** freeze clinic protocol version governance for a `draft` intake record.

TASK-005 snapshots are test/mock data. They do not approve a protocol, do not count as real-patient assignment, and do not require a new clinic version.
