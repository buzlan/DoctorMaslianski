# TASK-040 — Clinic workflow documentation alignment

Status: DONE

Milestone: M2 — Pilot domain (alignment before further M3 writes)

## Goal

Align Pilot MVP product documentation, protocol intake framing, and future task specs with clinic-confirmed sclerotherapy workflow.

Specify the replacement conceptual domain: patient-specific assignments, treatment periods, milestones, standing diary/photo/appointment rules.

Do **not** implement application code, domain types, TASK-041, or TASK-007 in this task.

## Why this task is needed

TASK-004 through TASK-006 shipped a versioned `PilotProtocol` + immutable `TreatmentSnapshot` model with two protocol kinds. Clinic feedback superseded that product model. Continuing TASK-007 against snapshot task ids would encode the wrong write path.

## Dependencies

- Clinic-confirmed product decisions (documented in PROJECT.md and `docs/domain-model.md`)
- Existing DONE work remains historically accurate: TASK-000–006, 026, 027, 004, 005

## Requirements

- Update PROJECT.md and ROADMAP locked decisions.
- Reframe protocol intake from two protocol variants to one sclerotherapy content set / action catalog. Telangiectasia is not a separate Pilot MVP path.
- Keep clinic content `draft` until explicitly approved for patient-facing use. Do not invent clinical instructions.
- Document the conceptual domain without implementing TypeScript types.
- Amend NOT STARTED future task specs so they do not instruct snapshot-based implementation.
- Do **not** rewrite DONE task files.
- Document that legacy ProductEvent `protocolKind` / `protocolVersion` context is **superseded**. Do **not** reinterpret `protocolVersion` as action-catalog version. The smallest ProductEvent schema adaptation is deferred to TASK-041 or a later explicit event-migration task when code requires it.
- No `src/` changes. No new dependencies.

## Out of scope

- TypeScript domain refactor (TASK-041)
- Task completion UI (TASK-007)
- Persistence, backend, invite/QR implementation, clinic-review app, push implementation
- Copying unapproved doctor-document text into patient-facing fixtures or UI
- Treating the doctor-supplied document as approved patient copy
- Preserving misleading ProductEvent semantics “for compatibility”

## Expected files or areas affected

- `PROJECT.md`
- `docs/ROADMAP.md`
- `docs/domain-model.md`
- `docs/protocols/**`
- `docs/tasks/040-clinic-workflow-alignment.md`
- NOT STARTED task specs listed in ROADMAP (007–015, 017–018 one-liners, 020, 025, 028, 029, 031–035)
- Optional one-line product-direction note in `.cursor/rules/project.mdc`

## New dependencies

No.

## Plan Mode

Yes (product model + downstream specs). This task is documentation only.

## Acceptance criteria

- PROJECT.md and ROADMAP locked decisions match the clinic-confirmed workflow.
- Protocol docs no longer present telangiectasia as a selectable Pilot MVP protocol.
- Sclerotherapy intake is framed as catalog + standing rules, still `draft`, with no engineering-invented clinical instructions.
- Conceptual domain model exists in `docs/domain-model.md`.
- TASK-007 and other listed future specs no longer instruct snapshot-task completion or the old stage timeline.
- ROADMAP order is 040 → 041 → 007; TASK-025 is in Pilot MVP **after TASK-034**.
- TASK-015 remains a real task, retargeted to doctor milestone photos.
- DONE task files are not rewritten.
- No `src/` changes. No new dependencies.

## Verification

Documentation/diff review against these acceptance criteria.

No TypeScript, lint, or test requirement (no `src/` changes).
