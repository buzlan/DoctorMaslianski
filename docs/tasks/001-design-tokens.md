# TASK-001 — Design tokens

Status: NOT STARTED

Milestone: M1 — Application Foundation

## Goal

Shared visual constants (color, spacing, typography, radii) used by later UI.

## Why this task is needed

Today and Treatment need a single palette instead of one-off hex values.

## Dependencies

- TASK-000 (DONE)

## Requirements

- TypeScript theme object under `src/shared/` (for example `src/shared/theme/`).
- Semantic names (`background`, `textPrimary`, `accent`), not only raw palettes.
- Wire the home screen to tokens so the app still launches.
- Dark/light: follow the system only if cheap with the current `userInterfaceStyle: automatic`. Do not build a theme switcher.
- No external design source is assumed. Derive a minimal palette from the existing splash color `#208AEF` and a calm clinical palette.

## Out of scope

- Component library
- NativeWind / Tamagui
- Navigation
- Product copy
- Screens beyond restyling the existing home
- Environment configuration
- Product functionality

## Expected files or areas affected

- Create `src/shared/theme/*`
- Possibly touch `src/app/index.tsx`

## New dependencies

No.

## Plan Mode

Yes (first `shared/` ownership).

## Acceptance criteria

- Tokens exist and are imported by the home screen.
- No product features were added.
- The app still shows the foundation screen.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify the application still launches on iOS Simulator and Android Emulator.
