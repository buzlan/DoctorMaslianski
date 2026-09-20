# TASK-032 — Photo upload to Supabase Storage

Status: DONE

Milestone: M9 — Supabase + sync

## Goal

Upload confirmed photos to Supabase Storage and store remote URIs.

Two distinct kinds:

- **PatientPhoto** — patient uploads from Today (TASK-014)
- **DoctorMilestonePhoto** — clinic uploads attached to a visit (TASK-034); the patient app may only need to read remote URIs for TASK-015

## Why this task is needed

Clinic review must see patient photos. The patient must see doctor visit photos. Local-only files are not enough for real patients.

## Dependencies

- TASK-031
- TASK-014 / TASK-015
- Storage from TASK-029

## Requirements

- Upload patient photos after confirm; retry if offline.
- Associate PatientPhoto with treatment + civil date (enforce max 3 per day remains an application rule).
- Associate DoctorMilestonePhoto with treatment + milestone. Patient app reads; clinic tool writes.
- ProductEvent must **not** contain photo URLs or image content.
- No on-device diagnosis.

## Out of scope

- Guided capture
- Public CDN without RLS
- Photos tab
- Patient gallery of own photos

## Expected files or areas affected

- Photos infrastructure
- Photo remote URI fields on both photo kinds

## New dependencies

No (use Supabase client from TASK-030).

## Plan Mode

Yes (native + storage + RLS; two object kinds).

## Acceptance criteria

- Confirmed patient photo appears in Storage and is listed for clinic review after relaunch from another session/device path as applicable.
- Doctor milestone photos are readable by the patient Treatment UI when URIs exist.
- Events still have no photo URLs.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

iOS and Android upload paths for patient photos.
