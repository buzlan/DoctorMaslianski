# TASK-003 — Navigation shell and Russian copy catalog

Status: DONE

Milestone: M1 — Application Foundation

## Goal

Expo Router tabs for **Today** and **Treatment**, plus a typed Russian copy catalog with no i18n library.

Pilot MVP primary navigation is **Today, Treatment, Diary**. Diary is added in TASK-012. This task ships the first two tabs only.

## Why this task is needed

This is the core information architecture, the first patient-visible Russian chrome, and a copy shape that allows a later English catalog without installing an i18n library now.

## Dependencies

- TASK-002

## Requirements

- Follow Expo Router v57 tabs: https://docs.expo.dev/versions/v57.0.0/router/advanced/tabs/
- Suggested routes:
  - `src/app/(tabs)/_layout.tsx`
  - `src/app/(tabs)/index.tsx` (Today)
  - `src/app/(tabs)/treatment.tsx`
- Root `src/app/_layout.tsx` stays a Stack so later stage details and modals can sit above tabs.
- Today and Treatment are placeholders (titles and copy only), not product data.
- Copy catalog:
  - `src/shared/copy/types.ts`
  - `src/shared/copy/ru.ts`
  - `src/shared/copy/index.ts` exporting Russian as `copy`
- Group copy by screen. No locale switcher.
- UI strings are Russian. Code identifiers stay English.

## Out of scope

- Diary tab (TASK-012)
- Activity tab (POST-MVP)
- Doctor tab (not in Pilot MVP)
- A Photos tab (photos are never a default top-level destination)
- Treatment data
- Authentication
- Linking behavior
- Environment configuration

## Expected files or areas affected

- `src/app/**`
- `src/shared/copy/**`

## New dependencies

No. `expo-router` is already present.

## Plan Mode

Yes (navigation architecture).

## Acceptance criteria

- Two tabs in Russian: Today and Treatment.
- Switching tabs works.
- The application remains runnable.
- English is not installed as a runtime locale.
- No Photos, Activity, or Doctor tab.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify tab switching on iOS Simulator and Android Emulator.
