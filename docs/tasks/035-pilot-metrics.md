# TASK-035 — Pilot metrics catalog and event coverage

Status: NOT STARTED

Milestone: M12 — Measurement / validation

## Goal

A metrics document and queries (or views) so the pilot can measure product usefulness.

**Do not hardcode success thresholds in application or medical logic.** Finalize numeric thresholds in the metrics doc **before Phase 3**.

## Why this task is needed

The MVP exists to learn whether the product is useful. Internal testers must not contaminate real-patient totals.

## Dependencies

- TASK-027
- TASK-031 event flush
- TASK-033 cohort assignment
- TASK-028 survey
- TASK-034 for clinic tally (optional)
- ProductEvent schema as adapted after TASK-041 / any explicit event migration (do not treat legacy `protocolVersion` as catalog version)

## Requirements

Every reported metric must be **segmentable** by:

- pilot cohort — `internal_dry_run` | `closed_beta` | `clinic_pilot`

The Pilot MVP has a **single** treatment context (sclerotherapy). Do **not** require sclerotherapy vs telangiectasia splits.

Phase 3 / Phase 4 evaluation queries **exclude** `internal_dry_run` by default (or use `clinic_pilot` only, as the metrics doc specifies).

Measurable:

- invited / activated (activation rate)
- treatment started
- assigned vs completed actions
- requested vs submitted diary entries
- patient photos submitted (counts; respect daily cap as product context, not a medical metric)
- doctor milestone photos viewed or present (if an event exists; otherwise clinic-side counts)
- journey completion / return engagement
- feedback completion
- usefulness score
- clarity score
- optional clinic clarification-contact count
- qualitative clinic notes

Diary **values** are not success metrics. Do not derive medical conclusions.

Confirm ProductEvent coverage: required names exist; **no** clinical payloads; no revived snapshot-protocol event semantics.

## Out of scope

- Complex analytics product
- Encoding “activation rate must be ≥ X” in the app
- Clinical efficacy claims
- Segmenting the MVP as two protocol kinds

## Expected files or areas affected

- `docs/` metrics catalog
- Optional SQL views in the other repo
- Gap list for missing events

## New dependencies

No.

## Plan Mode

Yes.

## Acceptance criteria

- Metrics catalog exists with cohort segmentation rules.
- Evaluation queries can exclude internal testers.
- Event privacy boundary is checked.
- No thresholds in app logic.
- The application remains runnable.

## Verification

Review the catalog and a sample query per cohort.
