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

## Requirements

Every reported metric must be **segmentable** by:

- protocol kind — sclerotherapy vs telangiectasia
- pilot cohort — `internal_dry_run` | `closed_beta` | `clinic_pilot`

Phase 3 / Phase 4 evaluation queries **exclude** `internal_dry_run` by default (or use `clinic_pilot` only, as the metrics doc specifies).

Measurable:

- invited / activated (activation rate)
- treatment started
- scheduled vs completed tasks
- requested vs submitted check-ins
- requested vs completed photo checkpoints
- journey completion / return engagement
- feedback completion
- usefulness score
- clarity score
- optional clinic clarification-contact count
- qualitative clinic notes

Symptom **values** are not success metrics. Do not derive medical conclusions.

Confirm ProductEvent coverage: required names exist; **no** clinical payloads.

## Out of scope

- Complex analytics product
- Encoding “activation rate must be ≥ X” in the app
- Clinical efficacy claims

## Expected files or areas affected

- `docs/` metrics catalog
- Optional SQL views in the other repo
- Gap list for missing events

## New dependencies

No.

## Plan Mode

Yes.

## Acceptance criteria

- Metrics catalog exists with segmentation rules.
- Evaluation queries can exclude internal testers.
- Event privacy boundary is checked.
- No thresholds in app logic.
- The application remains runnable.

## Verification

Review the catalog and a sample query per protocol kind and cohort.
