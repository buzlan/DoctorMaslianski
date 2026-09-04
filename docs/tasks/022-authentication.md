# TASK-022 — Authentication infrastructure

Status: NOT STARTED

Milestone: M9 — Supabase + sync

## Goal

Patient session against **Supabase Auth**, shaped by the closed-pilot invite flow in [TASK-033](033-pilot-invite.md).

## Why this task is needed

Remote patient data cannot be fetched anonymously.

## Dependencies

- TASK-030 (Supabase client)
- Schema/auth allowlists from TASK-029

## Requirements

- Logged-out vs logged-in gate.
- Secure session storage via Expo-compatible secure storage if required by Supabase/Expo.
- TASK-030 persists Auth sessions with AsyncStorage as client plumbing only. Before enabling real-patient authentication, review and harden session-at-rest storage. Do not ship real-patient auth on unreviewed AsyncStorage.
- No silent production backdoor.
- Invite/activation UX is TASK-033; this task is session infrastructure.
- Patient record must be able to hold consent timestamps and document version (populated in TASK-033).

## Out of scope

- Full invite UX (TASK-033)
- Social login unless the pilot contract requires it
- Clinic staff login (other repo)

## Expected files or areas affected

- `src/core/` auth/session only if justified
- App root gate

## New dependencies

Maybe `expo-secure-store`. Justify in Plan Mode.

## Plan Mode

Yes.

## Acceptance criteria

- An authenticated session is possible in a configured env.
- The app still has a safe logged-out state.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Both platforms.
