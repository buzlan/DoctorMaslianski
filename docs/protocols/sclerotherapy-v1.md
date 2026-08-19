# Protocol: sclerotherapy v1

Content in this file is clinic-authored or explicitly marked as missing.
Missing fields are not medical advice. Do not treat placeholder structure as
treatment instructions. Do not copy intake markers into patient-facing fixtures.

## Identity

- kind: `sclerotherapy`
- version: `1`
- status: `draft`
- source: clinic / doctor
- owner: Doctor Maslianski clinic
- patientFacingLanguage: Russian (values remain empty until the clinic supplies them)
- contentBoundary: engineering did not invent clinical values

This version is **not** approved and is **not** assignable to patients as clinical truth.

## Versioning

- While this record is `draft` and has never been approved or assigned to a real patient, the clinic may edit it in place.
- Once this version is `approved`, later clinical content changes create a new monotonic version (for example `sclerotherapy-v2.md`), not a mutation of version 1.
- Once this version has been assigned to a real patient, that Treatment keeps its immutable assigned snapshot.
- Test/mock snapshots created by TASK-005 do not freeze this clinic protocol version and do not force a new version.

## Stages

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

No stages are defined. Do not invent stage names or day ranges.

| id | title | summary | timingRule | order |
| --- | --- | --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic | TBD by clinic | TBD |

## Tasks

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

No tasks are defined. Do not invent daily actions.

| id | stageId | title | instruction | scheduleRule |
| --- | --- | --- | --- | --- |
| TBD | TBD | TBD by clinic | TBD by clinic | TBD by clinic |

## Check-in definitions (active protocol data)

Content status: TBD by clinic.

No active check-in questions in this version.

Unapproved product proposals for clinic review are not protocol data. See [README.md](README.md) under **Candidate questions for clinic review (not protocol data)**.

## Photo checkpoints

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

No photo checkpoints are defined. Do not invent a photo schedule.

| id | stageId | title | when | captureNotes |
| --- | --- | --- | --- | --- |
| TBD | TBD | TBD by clinic | TBD by clinic | TBD by clinic |

## Restrictions

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

No restrictions are defined. Do not invent limits.

| id | title | instruction | appliesWhen |
| --- | --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic | TBD by clinic |

## Control appointment pattern

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

No control appointment pattern is defined. Do not invent visit cadence.

| id | label | when |
| --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic |

## Other clinic-authored instructions

Content status: TBD by clinic.

None supplied. Add rows only if the clinic provides them. Do not invent instructions.

## Unresolved / missing fields

All clinical content is pending clinic confirmation:

- [ ] stages
- [ ] tasks
- [ ] check-in definitions
- [ ] photo checkpoints
- [ ] restrictions
- [ ] control appointment pattern
- [ ] other clinic-authored instructions
