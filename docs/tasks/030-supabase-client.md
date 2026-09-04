# TASK-030 — Mobile environment and Supabase client

Status: DONE

Milestone: M9 — Supabase + sync

[TASK-021](021-api-client.md) is an alias of this task. **Do not implement TASK-021 separately.**

## Goal

First justified environment configuration: Supabase URL and anon key, plus an application-owned client wrapper.

## Why this task is needed

M1 must not speculate on env files. Networking needs a real backend boundary.

## Dependencies

- TASK-029 (project exists)
- Local companion useful (M8)

## Requirements

- Env pattern for debug/prod (no secrets in git).
- Thin client in `src/core/` (or equivalent) that product modules do not scatter `supabase-js` calls through UI.
- App still runs against mocks until TASK-031 swaps repositories.
- Follow Expo SDK 57 docs for env.

## Out of scope

- Replacing all mocks in this task
- Invite UX (TASK-033)
- Inventing REST endpoints besides Supabase

## Expected files or areas affected

- Env files / EAS secrets later
- `src/core/` client
- `app.json` / Expo extra only if required

## New dependencies

- `@supabase/supabase-js`
- `react-native-url-polyfill`

## Plan Mode

Yes.

## Acceptance criteria

- Client initializes from env.
- Mocks still work until 031.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Both platforms launch.
