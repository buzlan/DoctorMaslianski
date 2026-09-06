# TASK-039 — Production EAS and store submission

Status: NOT STARTED

Milestone: M16 — Public store release

## Goal

Production EAS profiles and env, App Store screenshots/metadata (Russian), Google Play listing, App Store submission, Google Play submission.

Ship public store builds **only if Phase 4 (M15) says proceed**.

## Why this task is needed

Development completion is not the end of the MVP. The final milestone is a version that **can** be distributed through Apple App Store and Google Play if evaluation justifies public release.

## Dependencies

- TASK-037
- TASK-038
- M15 evaluation decision to proceed

## Requirements

- Production env (Supabase prod, no debug backdoors)
- Store screenshots and metadata
- Privacy policy URL
- Follow Expo SDK 57 submission docs

## Out of scope

- Starting this task during M1–M8
- Submitting if Phase 4 chose stop
- HealthKit / extra protocols

## Expected files or areas affected

- `eas.json` production profiles
- Store assets (not necessarily in `src/`)

## New dependencies

No application libraries.

## Plan Mode

Yes.

## Acceptance criteria

- If Phase 4 proceeds: production builds submitted (or ready to submit) to App Store and Google Play.
- If Phase 4 does not proceed: this task stays NOT STARTED and is not forced.
- The application remains runnable.

## Verification

EAS production build; store listing checklist; both platform binaries.
