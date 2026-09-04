# TASK-015 — Doctor milestone photos on Treatment

Status: NOT STARTED

Milestone: M7 — Photos

## Goal

The patient can view **doctor-uploaded** photos attached to a treatment milestone / visit from the Treatment screen (timeline and/or visit details).

This is **not** a gallery of the patient’s own Today uploads. Patient photos have no patient-facing gallery (TASK-014).

Uploads of doctor photos are performed by the clinic tool (TASK-034) and stored remotely in TASK-032. This patient-app task displays photos already associated with a milestone (mock/local first, remote later).

Still no Photos tab.

## Why this task is needed

Doctor stage photos and patient daily photos are distinct data flows. Patients need to see visit photos the doctor attached (for example Procedure or Control visit).

## Dependencies

- TASK-008 / TASK-009 (Treatment surfaces exist)
- TASK-014 need not be a hard code dependency, but keep the two photo kinds distinct in the domain. Sequence after TASK-014 so patient upload is already specified.

## Requirements

- Display `DoctorMilestonePhoto` rows on Treatment / visit details.
- Associate photos with `milestoneId` + `treatmentId`.
- No medical comparison copy (“looks better/worse”).
- No patient gallery of PatientPhoto rows.
- Placement: existing Treatment surfaces or a nested screen pushed from them — not a fourth tab.

## Out of scope

- Dedicated Photos tab
- Patient gallery of own photos
- Patient capture (TASK-014)
- Guided capture
- AI
- Sharing
- Clinic upload UI (other repo, TASK-034)

## Expected files or areas affected

- Photos and/or treatment presentation
- Existing Treatment routes (plus nested stack screens if needed)

## New dependencies

No (use an existing image component if already added).

## Plan Mode

Yes (doctor-photo display vs patient-photo capture must stay distinct).

## Acceptance criteria

- Doctor photos attached to a visit are visible from Treatment after relaunch (from mock/local data until TASK-032/034).
- Patient-uploaded Today photos are not shown as a patient gallery.
- Primary navigation is unchanged.
- No Photos tab.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify on iOS Simulator and Android Emulator.

Confirm there is no Photos tab and no patient gallery of own photos.
