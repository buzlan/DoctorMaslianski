# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Cursor Cloud specific instructions

- Install with `npm ci`. The lockfile is npm. Node.js 22 is already on the image.
- After TypeScript changes, run `npx tsc --noEmit`, `npm run lint`, and `npm test`.
- The web app is the local demo surface. Start it with `npx expo start --web --host lan --port 8081` and open http://localhost:8081. Leave `CI` unset. `CI=1` puts Metro in CI mode and disables file watching.
- `EXPO_PUBLIC_SUPABASE_URL` and the publishable key are optional for local development. When they are unset, development mode keeps local fixtures and opens the clinical shell (Today, Treatment, Diary). Hosted Pilot values belong in `scripts/.env.pilot.local`, not a root `.env*` file.
- iOS Simulator and Android Emulator are not available in this Linux environment.
