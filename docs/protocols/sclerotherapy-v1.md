# Sclerotherapy content: v1

Content in this file is clinic-authored or explicitly marked as missing.
Missing fields are not medical advice. Do not treat placeholder structure as
treatment instructions. Do not copy intake markers into patient-facing fixtures.

A doctor-supplied document may exist as source material. It is **not** approved
patient-facing copy until the clinic explicitly approves this version.

## Identity

- kind: `sclerotherapy`
- version: `1`
- status: `draft`
- source: clinic / doctor
- owner: Doctor Maslianski clinic
- patientFacingLanguage: Russian (values remain empty until the clinic supplies and approves them)
- contentBoundary: engineering did not invent clinical values

This version is **not** approved and is **not** assignable to patients as clinical truth.

This is the only Pilot MVP treatment content set. It is an action catalog plus standing rules, not a patient-selectable protocol variant and not a protocol editor.

## Versioning

- While this record is `draft` and has never been approved or assigned to a real patient, the clinic may edit it in place.
- Once this version is `approved`, later clinical content changes create a new monotonic version (for example `sclerotherapy-v2.md`), not a mutation of version 1.
- Once actions from this version have been assigned to a real patient, those assignments and their completions keep their history. Later catalog versions do not rewrite that history.
- Test/mock data created by TASK-005 or TASK-041 does not freeze this clinic content version and does not force a new version.
- Content `version` is not ProductEvent `protocolVersion`. Do not reuse the legacy event field to mean catalog version.

## Action catalog

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

No catalog items are defined. Do not invent daily actions.

The doctor selects catalog items for a patient (checkboxes) and sets an inclusive start date and end date. The doctor may later add, disable, or replace an assignment. Disabling must not delete historical completions.

| id | title | instruction |
| --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic |

## Treatment milestones / visits

Content status: TBD by clinic. Placeholder structure only. Do not treat as medical advice.

No milestone kinds are defined. Do not invent visit names.

Do not use a fixed mock such as Preparation → Procedure → Day 1 → Day 7 → Control.

Treatment consists of clinical milestones/visits plus a current treatment period. The current period displays “День N”. Day 1 is the period start. After a control visit, if the doctor continues treatment, the doctor starts a new period and Day N resets to 1. Previous periods and visits remain in history. The final milestone is a control visit / completion decision.

| id | kind | title |
| --- | --- | --- |
| TBD | TBD by clinic | TBD by clinic |

## Standing diary (active treatment)

Content status: clinic-confirmed **structure**; patient-facing copy still draft until this record is approved.

Available once per calendar day during the entire active treatment. After submission, it is completed for that day and is not offered again until the next calendar day.

| field | scale |
| --- | --- |
| pain | VAS 0–10 |
| swelling | VAS 0–10 |
| general wellbeing | Лучше / Без изменений / Хуже |

Do not infer clinical meaning or thresholds from answers. Do not add extra dimensions unless the clinic later approves them.

## Patient photos

Content status: clinic-confirmed **structure**. Do not invent capture medical notes.

- Patient uploads from Today.
- Maximum 3 patient-uploaded photos per calendar day.
- Patient does not have a gallery of their own submitted photos.
- Clinic/doctor can review them.

## Doctor milestone photos

Content status: clinic-confirmed **structure**. Do not invent capture medical notes.

- Doctor uploads photos and attaches them to a treatment milestone/visit.
- Patient can view doctor-uploaded photos from the Treatment screen.
- Keep these distinct from patient photos in the data model.

## Appointment

Content status: clinic-confirmed **workflow**. No pattern table to invent.

The doctor sets the next appointment date/time and may change it later. History is superseded, not silently destroyed. The patient sees the current appointment.

## Other clinic-authored instructions

Content status: TBD by clinic.

None supplied and approved. Add rows only if the clinic provides and approves them. Do not invent instructions.

## Unresolved / missing fields

Clinical catalog and visit labels are pending clinic confirmation:

- [ ] action catalog items (titles and instructions)
- [ ] treatment milestone / visit kinds and titles
- [ ] any additional clinic-authored instructions

Standing diary fields, patient photo cap, doctor photo placement, and doctor-set appointment are structurally agreed and still sit on a `draft` content record until the clinic approves patient-facing use.
