# Physical-device Pilot (TASK-036)

Hosted Pilot + EAS development build on one physical iPhone. Product behavior is unchanged.

Local simulator development stays on `.env.local` → `http://127.0.0.1:54321`. Do not overwrite that file with hosted values.

## Environments

- **local** — `.env.local`, local Supabase, `npx expo start`
- **pilot** — hosted Supabase + Vercel clinic-review + EAS `development` / `preview` / later `testflight`
- **production** — reserved for TASK-039. Do not put Pilot credentials on the EAS `production` environment.

## EAS profiles

| Profile | Use | EAS environment |
| --- | --- | --- |
| `development` | Physical iPhone, `expo-dev-client`, Metro | `development` (Pilot publishable) |
| `preview` | Standalone internal IPA, no Metro | `preview` (same Pilot publishable) |
| `testflight` | Later internal TestFlight, after device E2E | `preview` (same Pilot publishable) |

There is no `production` profile in `eas.json` yet.

EAS project: `@buzlik/doctor-maslianski` (`ea96abd3-3954-434b-8b74-5ab91b2a6bee`).

`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set on EAS environments **development** and **preview** only. EAS **production** has no Pilot variables.

First iOS ad hoc build needs an Apple Developer login in an interactive terminal (EAS account `buzlik` has no Apple team yet):

```bash
cd /Users/ihar/DoctorMaslianski
npx eas-cli device:create
npx eas-cli build --profile development --platform ios
```

Hosted clinic-review: https://doctor-maslianski-clinic-review.vercel.app  
Synthetic staff: `staff.synthetic@pilot.test` (password in the pilot repo gitignored `.env.hosted`).

## Mobile env files

| File | Git | Purpose |
| --- | --- | --- |
| `.env.example` | tracked | Local localhost template |
| `.env.local` | ignored | Local simulator |
| `.env.pilot.example` | tracked | Hosted placeholders |
| `scripts/.env.pilot.local` | ignored | Hosted publishable values sourced by the pilot script. Not at project root — Expo Metro would bundle a root `.env*.local` file as JS. |
| `.env.development.local` | ignored | Temporary file written by `start-pilot-device.sh` so Expo's virtual env does not let `.env.local` override the hosted URL on a physical device. Deleted when Metro exits. |

Never put `service_role` or `sb_secret_` keys in any of these files.

Do not run `eas env:pull` into `.env.local`.

## Commands

```bash
# Local simulator (unchanged)
npx expo start

# After scripts/.env.pilot.local is filled with hosted publishable values
npm run start:pilot-device

# EAS development build (physical iPhone, not simulator)
npx eas-cli build --profile development --platform ios
```

## Custom-scheme invite (TASK-036)

Primary, deterministic verification — **do not** treat iOS Camera QR as the only path:

1. In hosted clinic-review, issue an invite with cohort `internal_dry_run`.
2. Copy `doctormaslianski://invite/{token}`.
3. Get that URL onto the iPhone (Messages, Notes, AirDrop, or email to yourself) and tap/open it.
4. The development build must come to the foreground, land on invite/access, and activate the synthetic patient against **hosted** Supabase.

Optional: also scan the QR with Camera. Camera failing to recognize a non-HTTPS custom-scheme QR is **not** a TASK-036 blocker.

HTTPS Universal Links (`https://app.maslianski.by/invite/{token}`) are TASK-037.

## Synthetic data only

Use cohort `internal_dry_run`. Do not enter real patient names, phones, photos, or clinical notes during this verification.
