# TASK-036 — EAS development builds and internal distribution

Status: NOT STARTED

Milestone: M13 — Pilot readiness & distribution

## Goal

Expo EAS project, development builds (camera will need a dev client), and internal distribution for Phase 1 testers.

## Why this task is needed

Development completion on simulators is not enough for a device camera/photo pilot. Store tracks come next.

## Dependencies

- TASK-014 plugins as applicable
- Expo account / EAS project

## Requirements

- Follow Expo SDK 57 EAS docs: https://docs.expo.dev/versions/v57.0.0/
- iOS and Android development builds
- Internal distribution for ~2–3 internal testers
- Do not submit to App Store / Play production in this task

## Out of scope

- TestFlight / Play closed testing (TASK-037)
- Production store submission (TASK-039)
- Implementing TASK-001 product UI

## Expected files or areas affected

- `eas.json` (when created)
- EAS credentials (not committed secrets)

## New dependencies

EAS CLI as a workflow, not necessarily a package.json runtime dependency. Justify in Plan Mode.

## Plan Mode

Yes (native distribution).

## Acceptance criteria

- A development build installs on at least one iOS and one Android device or equivalent internal track.
- The application remains runnable in Expo Go or the dev client as designed.

## Verification

Install and smoke Today / capture as far as the current feature set allows.
