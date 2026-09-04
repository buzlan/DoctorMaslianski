# TASK-014 — Patient photo capture

Status: DONE

Milestone: M7 — Photos

## Goal

Permission → capture or pick → preview → retry → confirm. Save locally as a **PatientPhoto** with treatment + civil-date metadata.

Reach capture from **Today** only.

Maximum **3** patient-uploaded photos per calendar day. The patient does **not** have a gallery of their own submitted photos.

**Do not add a dedicated Photos tab.**

Uploads to Supabase are TASK-032. Clinic review of patient photos is TASK-034.

This flow is distinct from doctor milestone photos (TASK-015).

## Why this task is needed

Patient progress photos are a follow-up artifact the clinic can review, without expanding primary navigation and without a patient-facing gallery.

## Dependencies

- TASK-010 (storage patterns)
- Sequence after TASK-013 so Diary already exists; capture entry remains on Today.

## Requirements

- Expo-compatible camera/picker chosen in Plan Mode against Expo SDK 57 docs: https://docs.expo.dev/versions/v57.0.0/
- Hide native APIs behind an application-owned port in the photos module.
- Enforce the daily cap in application logic (civil date, max 3).
- No on-device diagnosis from images.
- Keep the tab bar unchanged (Today, Treatment, Diary) while treatment is active.
- Capture UI may be a stack or modal route, not a tab.
- Camera plugins may require an EAS development build (TASK-036) for device verification; simulators may be limited.
- ProductEvent may count a patient photo submit with **id** only. **Do not** put photo URLs or image content in event metadata. Do not attach superseded protocol snapshot event context.

## Out of scope

- Dedicated Photos tab
- Patient gallery of own photos
- Doctor milestone photo viewing (TASK-015)
- Guided overlay (TASK-016, POST-MVP)
- Before/after slider
- Uploads / cloud (TASK-032)
- HealthKit / Activity

## Expected files or areas affected

- `src/modules/photos/**`
- Stack/modal routes as needed
- Today entry point
- `app.json` plugins and permissions as required — verify both platforms if shared config changes

## New dependencies

Likely yes (`expo-camera` and/or `expo-image-picker`). `expo-image` is already in package.json.

## Plan Mode

Yes (native + permissions + daily cap).

## Acceptance criteria

- Capture/confirm works on simulator/emulator as far as cameras allow.
- A fourth photo on the same civil date is refused.
- Metadata is stored locally.
- The patient can start capture from Today.
- There is no patient gallery of submitted photos.
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
