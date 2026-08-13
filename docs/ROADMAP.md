# Doctor Maslianski — Development Roadmap

This roadmap describes the planned order of development.

Individual implementation work must be defined in separate files inside `docs/tasks`.

---

## M0 — Project Foundation

Status: IN PROGRESS

Goals:

- Expo application
- React Native
- TypeScript
- Expo Router
- iOS launch
- Android launch
- clean starter application
- project documentation
- Cursor rules
- Git baseline

---

## M1 — Application Foundation

Goals:

- final source folder structure
- application bootstrap
- architecture boundaries
- environment configuration
- error handling foundation
- design tokens
- basic UI primitives
- navigation shell

No medical/product functionality yet.

---

## M2 — Treatment Domain

Goals:

- Patient model
- Treatment model
- TreatmentStage model
- TreatmentTask model
- treatment status
- mock treatment repository
- test treatment data

No backend.

---

## M3 — Today

Goals:

- patient Today screen
- current treatment stage
- today's tasks
- next appointment
- task completion
- loading / empty / error states

Data initially comes from mock repositories.

---

## M4 — Treatment Timeline

Goals:

- treatment overview
- timeline stages
- completed stages
- current stage
- upcoming stages
- stage details

---

## M5 — Local State and Persistence

Goals:

- application state layer
- optimistic task completion
- local persistence
- basic offline behavior

State management technology should be selected only at this stage or earlier if required by a concrete task.

---

## M6 — Symptom Diary

Goals:

- symptom check-in domain
- pain
- swelling
- heaviness
- itching
- burning
- feeling compared with previous day
- validation
- submission
- symptom history

---

## M7 — Progress Photos

Goals:

- camera permission
- photo capture
- preview
- retry
- confirmation
- photo metadata
- treatment association

Later:

- guided capture
- standardized angle
- before / after comparison

---

## M8 — Activity

Goals:

iOS:

- HealthKit

Android:

- Health Connect

Initial functionality:

- request permission
- read daily steps
- display doctor-defined step target

---

## M9 — Backend Integration

Goals:

- API client
- repository implementations
- authentication infrastructure
- patient API
- treatment API
- tasks API
- diary API
- photo uploads
- appointments API

---

## M10 — Patient Onboarding

Goals:

- doctor invite
- QR / link
- deep linking
- patient activation
- authentication
- account recovery

---

## M11 — Notifications

Goals:

- push token registration
- task reminders
- check-in reminders
- appointment reminders
- notification deep links

---

## M12 — Doctor Platform

Separate web application.

Possible goals:

- doctor authentication
- patient list
- patient profile
- treatment protocols
- treatment assignment
- symptoms
- photos
- activity
- appointments

---

## M13 — Production Readiness

Goals:

- crash reporting
- analytics
- performance review
- accessibility
- security review
- privacy review
- App Store preparation
- Google Play preparation
- production builds
