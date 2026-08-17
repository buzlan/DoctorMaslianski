# TASK-014 — Photo capture

Status: NOT STARTED

Milestone: M7 — Progress Photos

## Goal

Permission → capture or pick → preview → retry → confirm. Save locally with metadata and treatment/stage association.

Reach capture from relevant existing surfaces (Today when the snapshot requests a photo, and/or Treatment stage details, and/or Diary).

**Do not add a dedicated Photos tab.**

Uploads to Supabase are TASK-032.

## Why this task is needed

Progress photos are a core follow-up artifact after diary, without expanding primary navigation.

## Dependencies

- TASK-010 (storage patterns)
- Sequence after TASK-013 so Diary and stage details already exist as entry points.

## Requirements

- Expo-compatible camera/picker chosen in Plan Mode against Expo SDK 57 docs: https://docs.expo.dev/versions/v57.0.0/
- Hide native APIs behind an application-owned port in the photos module.
- No on-device diagnosis from images.
- Keep the tab bar unchanged (Today, Treatment, Diary).
- Capture UI may be a stack or modal route, not a tab.
- Camera plugins may require an EAS development build (TASK-036) for device verification; simulators may be limited.
- ProductEvent `photo_checkpoint_requested` / `photo_checkpoint_completed` may use checkpoint **ids** only. **Do not** put photo URLs or image content in event metadata.

## Out of scope

- Dedicated Photos tab
- Guided overlay (TASK-016, POST-MVP)
- Before/after slider
- Uploads / cloud (TASK-032)
- HealthKit / Activity

## Expected files or areas affected

- `src/modules/photos/**`
- Stack/modal routes as needed
- Entry points on Today / Diary / stage details
- `app.json` plugins and permissions as required — verify both platforms if shared config changes

## New dependencies

Likely yes (`expo-camera` and/or `expo-image-picker`). `expo-image` is already in package.json.

## Plan Mode

Yes (native + permissions + which surfaces host capture).

## Acceptance criteria

- Capture/confirm works on simulator/emulator as far as cameras allow.
- Metadata is stored locally.
- The patient can start capture from at least one existing surface.
- **No new top-level tab.**
- The application remains runnable.
- The app does not interpret photos medically.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Verify iOS and Android permission and capture paths as far as the current build type allows.

Confirm the tab bar still has no Photos item.
