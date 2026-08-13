# Doctor Maslianski

Doctor Maslianski is a React Native mobile application for patients of a phlebologist.

The current application name is temporary and may change in the future.

## Product purpose

The website maslianski.by is responsible for attracting and informing patients.

The mobile application is intended to accompany a patient after consultation and throughout treatment.

The application should answer the patient's main daily question:

"What should I do today?"

## Primary user

Patient.

A doctor-facing web dashboard may be developed later as a separate application.

## Core patient journey

Doctor assigns treatment
→ Patient receives a treatment plan
→ Patient sees today's actions
→ Patient completes treatment tasks
→ Patient submits symptoms
→ Patient submits progress photos
→ Activity may be collected from the device
→ Doctor reviews patient progress
→ Patient receives follow-up instructions

## Core product concept

Treatment Timeline.

A treatment consists of stages such as:

- consultation
- ultrasound
- diagnosis
- preparation
- procedure
- day 1
- day 3
- day 7
- month 1
- month 3
- follow-up

Each stage may contain:

- tasks
- recommendations
- symptom check-in
- photo request
- activity goal
- appointment
- educational material

## Planned mobile sections

### Today

The primary screen.

Shows only what is relevant to the patient today.

Examples:

- treatment stage
- today's tasks
- walking goal
- symptom check-in
- photo request
- next appointment

### Treatment

Treatment Timeline and treatment history.

### Diary

Symptoms and symptom history.

Possible symptoms:

- pain
- swelling
- heaviness
- itching
- burning

### Photos

Standardized progress photos.

Possible future functionality:

- guided capture
- leg positioning overlay
- before / after comparison
- consistent photo angle

### Activity

Activity information obtained with user permission.

iOS:

- HealthKit

Android:

- Health Connect

Initial metric:

- daily step count

Medical activity targets must be defined by a doctor or treatment protocol.

### Doctor

Doctor information, appointments, instructions and communication entry points.

## Medical safety

The mobile application must not independently:

- diagnose a patient
- prescribe treatment
- change treatment
- determine medical thresholds
- give emergency medical conclusions

Medical recommendations originate from a doctor or a doctor-defined treatment protocol.

The application may collect, display and structure patient information.

## Planned native integrations

### iOS

- HealthKit
- Camera
- Push Notifications
- Universal Links
- Keychain

### Android

- Health Connect
- Camera
- Push Notifications
- App Links
- Keystore

## Technical foundation

- React Native
- Expo
- Expo Router
- TypeScript

State management, networking and persistence libraries will be selected when their corresponding requirements are implemented.

Do not add libraries simply because they may be useful in the future.

## Architecture principles

- Organize application functionality primarily by product domain.
- Business logic must not live inside React components.
- Domain logic should remain independent of React Native where practical.
- Native integrations should be hidden behind application-owned interfaces.
- Prefer simple solutions over speculative abstractions.
- Build features using small vertical slices.
- Keep the application working after every completed task.

## Current development stage

Milestone 1 — Application Foundation.

Milestone 0 — Foundation is complete.

Currently implemented:

- Expo project
- TypeScript
- Expo Router
- iOS launch
- Android launch
- empty initial application screen

No product functionality is implemented yet.

The development backlog lives in `docs/ROADMAP.md` and `docs/tasks/`. The next implementation task is TASK-001.
