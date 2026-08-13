# TASK-014 — Photo capture

Status: NOT STARTED

Milestone: M7 — Progress Photos

## Goal

Permission → capture or pick → preview → retry → confirm. Save locally with metadata and treatment/stage association.

Reach capture from relevant existing surfaces (Today when the protocol requests a photo, and/or Treatment stage details, and/or Diary).

**Do not add a dedicated Photos tab.**

## Why this task is needed

Progress photos are a core follow-up artifact after diary, without expanding primary navigation.

## Dependencies

- TASK-010 (storage patterns)
- Sequence after TASK-013 so Diary and stage details already exist as entry points. Can theoretically start after TASK-009 for stage-details-only entry; prefer after Diary so Today, Diary, and stage details can all host the flow.

## Requirements

- Expo-compatible camera/picker chosen in Plan Mode against Expo SDK 57 docs: https://docs.expo.dev/versions/v57.0.0/
- Hide native APIs behind an application-owned port in the photos module.
- No on-device diagnosis from images.
- Keep the tab bar unchanged (Today, Treatment, Diary at this point).
- Capture UI may be a stack or modal route, not a tab.
- Photos are a capability, not a primary navigation destination.

## Out of scope

- Dedicated Photos tab
- Guided overlay
- Before/after slider
- Uploads
- Cloud

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
- Metadata is stored.
- The patient can start capture from at least one existing surface (Today and/or stage details and/or Diary).
- **No new top-level tab.**
- The application remains runnable.
- The app does not interpret photos medically.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Verify iOS and Android permission and capture paths.

Confirm the tab bar still has no Photos item.
