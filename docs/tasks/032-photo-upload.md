# TASK-032 — Photo upload to Supabase Storage

Status: NOT STARTED

Milestone: M9 — Supabase + sync

## Goal

Upload confirmed progress photos to Supabase Storage and store remote URIs on `PhotoEntry`.

## Why this task is needed

Clinic review must see photos. Local-only files are not enough for real patients.

## Dependencies

- TASK-031
- TASK-014 / TASK-015
- Storage bucket from TASK-029

## Requirements

- Upload after confirm; retry if offline.
- Associate with treatment/stage/checkpoint ids.
- ProductEvent must **not** contain photo URLs or image content.
- No on-device diagnosis.

## Out of scope

- Guided capture
- Public CDN without RLS
- Photos tab

## Expected files or areas affected

- Photos infrastructure
- PhotoEntry remote URI field

## New dependencies

No (use Supabase client from TASK-030).

## Plan Mode

Yes (native + storage + RLS).

## Acceptance criteria

- Confirmed photo appears in Storage and is listed after relaunch from another session/device path as applicable.
- Events still have no photo URLs.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

iOS and Android upload paths.
