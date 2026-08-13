# TASK-000 — Project Foundation

Status: DONE

## Goal

Create and verify the initial technical foundation for the Doctor Maslianski mobile application.

The goal of this task is to have a clean React Native project that successfully runs on both iOS and Android before any real product functionality is added.

## Requirements

The project must use:

- React Native
- Expo
- TypeScript
- Expo Router

The application must successfully run on:

- iOS Simulator
- Android Emulator

## Application identity

Application display name:

Doctor Maslianski

Current Expo slug:

doctor-maslianski

Current application scheme:

doctormaslianski

iOS bundle identifier:

by.maslianski.app

Android package:

by.maslianski.app

The visible application name may change in the future.

The bundle identifier and Android package should be treated as stable technical identifiers unless there is a strong reason to change them.

## Current application UI

For this task the application should contain only a minimal initial screen.

The screen displays:

Doctor Maslianski

The text should be centered on the screen.

No actual product functionality should exist yet.

## Source structure

At the end of this task the source code should contain only the minimal application foundation required to launch the project.

Current expected structure:

````text
src/
  app/
    _layout.tsx
    index.tsx

Do not create future product modules during this task.

## Required project documentation

The repository must contain:

- PROJECT.md
- AGENTS.md
- docs/ROADMAP.md
- docs/tasks/000-foundation.md
- .cursor/rules/project.mdc
- .cursor/rules/architecture.mdc
- .cursor/rules/workflow.mdc

## Cursor configuration

Cursor must have project-level rules describing:

- project purpose
- architecture principles
- development workflow
- dependency policy
- medical product safety constraints

The rules must live inside:

.cursor/rules/

## Out of scope

Do not implement any of the following during TASK-000:

- authentication
- patient onboarding
- MobX
- API client
- backend integration
- treatment functionality
- treatment timeline
- navigation tabs
- symptom diary
- forms
- camera functionality
- HealthKit
- Health Connect
- push notifications
- local persistence
- analytics
- error monitoring
- design system
- doctor dashboard

Do not install libraries for future functionality.

Do not add abstractions for features that do not exist yet.

## Acceptance criteria

TASK-000 is complete when all of the following are true:

- Expo project is configured
- TypeScript is enabled
- Expo Router is configured
- application display name is Doctor Maslianski
- iOS bundle identifier is by.maslianski.app
- Android package is by.maslianski.app
- application launches successfully on iOS Simulator
- application launches successfully on Android Emulator
- initial screen displays Doctor Maslianski
- unnecessary Expo starter/demo screens have been removed
- PROJECT.md exists
- AGENTS.md exists
- docs/ROADMAP.md exists
- Cursor rules exist
- TypeScript check succeeds
- lint check succeeds
- no unnecessary dependencies were added for future functionality

## Verification

Run the TypeScript check:

```text
npx tsc --noEmit

Run lint:

npm run lint

Manually verify the application on iOS Simulator.

Manually verify the application on Android Emulator.

Confirm that the initial screen displays:

Doctor Maslianski

## Completion

When all acceptance criteria are satisfied, change:

Status: IN PROGRESS

to:

Status: DONE

Then create a Git commit for the completed foundation task.

Suggested commit message:

```bash
git commit -m "chore: establish mobile app foundation"
````
