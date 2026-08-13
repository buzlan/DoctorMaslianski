# Doctor Maslianski — Development Roadmap

This roadmap describes the planned order of development.

Individual implementation work is defined in separate files inside `docs/tasks`.

Do not implement a later milestone during an earlier task.

The application must remain runnable after every completed task.

---

## Locked product decisions

- **UI language:** Russian strings. Typed copy catalog so English can be added later. No i18n library until a second language is switched at runtime.
- **Intended primary navigation (about five sections):** Today, Treatment, Diary, Activity, Doctor.
- **Progress photos** are a capability reached from Today, Diary, and/or Treatment stage details. Photos are **not** a mandatory top-level navigation destination.
- **Doctor** is a section. Its navigation placement is decided in TASK-020 Plan Mode. Do not assume a sixth tab.
- **Environment configuration** is deferred until the real API boundary (M9 / TASK-021). It is not part of M1.
- **TASK-021 through TASK-025** are coarse placeholders. They must be re-planned and may be split before implementation once backend contracts exist.
- Medical recommendations and thresholds originate from a doctor or a doctor-defined protocol. The app must not diagnose, prescribe, change treatment, or give emergency conclusions.

---

## Task index

| Milestone | Tasks | Status |
| --- | --- | --- |
| M0 — Project Foundation | [TASK-000](tasks/000-foundation.md) | DONE |
| M1 — Application Foundation | [001](tasks/001-design-tokens.md), [002](tasks/002-ui-primitives.md), [003](tasks/003-navigation-shell.md) | NOT STARTED |
| M2 — Treatment Domain | [004](tasks/004-treatment-domain.md), [005](tasks/005-mock-repository.md) | NOT STARTED |
| M3 — Today | [006](tasks/006-today-screen.md), [007](tasks/007-task-completion.md) | NOT STARTED |
| M4 — Treatment Timeline | [008](tasks/008-treatment-timeline.md), [009](tasks/009-stage-details.md) | NOT STARTED |
| M5 — Local State and Persistence | [010](tasks/010-persist-task-completion.md) | NOT STARTED |
| M6 — Symptom Diary | [011](tasks/011-diary-domain.md), [012](tasks/012-symptom-check-in.md), [013](tasks/013-symptom-history.md) | NOT STARTED |
| M7 — Progress Photos | [014](tasks/014-photo-capture.md), [015](tasks/015-photo-gallery.md), [016](tasks/016-guided-capture.md) | NOT STARTED |
| M8 — Activity | [017](tasks/017-healthkit.md), [018](tasks/018-health-connect.md), [019](tasks/019-activity-today.md) | NOT STARTED |
| Doctor section (mobile, mock) | [020](tasks/020-doctor-section.md) | NOT STARTED |
| M9 — Backend Integration | [021](tasks/021-api-client.md), [022](tasks/022-authentication.md), [023](tasks/023-remote-repositories.md) | COARSE — re-plan before implementation |
| M10 — Patient Onboarding | [024](tasks/024-invite-deep-links.md) | COARSE — re-plan before implementation |
| M11 — Notifications | [025](tasks/025-notifications.md) | COARSE — re-plan before implementation |
| M12 — Doctor Platform | Separate web application | Out of this repository |
| M13 — Production Readiness | Future TASK-026+ | Not in the current mobile backlog |

---

## M0 — Project Foundation

Status: DONE

Task: [TASK-000](tasks/000-foundation.md)

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

Status: NOT STARTED

Tasks: [TASK-001](tasks/001-design-tokens.md), [TASK-002](tasks/002-ui-primitives.md), [TASK-003](tasks/003-navigation-shell.md)

Goals:

- source folders created only when needed (`shared/` for theme, UI, copy)
- design tokens
- basic UI primitives
- navigation shell: Today and Treatment tabs
- Russian copy catalog (no i18n library)

No medical/product functionality yet.

**Not in M1:**

- environment configuration (deferred to M9 / TASK-021)
- error-handling platform / logging infrastructure
- API client
- empty product modules
- Diary, Activity, or Doctor tabs
- Photos tab

---

## M2 — Treatment Domain

Status: NOT STARTED

Tasks: [TASK-004](tasks/004-treatment-domain.md), [TASK-005](tasks/005-mock-repository.md)

Goals:

- Patient model
- Treatment model
- TreatmentStage model
- TreatmentTask model
- treatment status
- unit test harness
- mock treatment repository
- test treatment data

No backend. No UI beyond the existing navigation placeholders.

---

## M3 — Today

Status: NOT STARTED

Tasks: [TASK-006](tasks/006-today-screen.md), [TASK-007](tasks/007-task-completion.md)

Goals:

- patient Today screen
- current treatment stage
- today's tasks
- next appointment
- loading / empty / error states
- in-memory task completion

Data comes from mock repositories. Completions do not persist until M5.

---

## M4 — Treatment Timeline

Status: NOT STARTED

Tasks: [TASK-008](tasks/008-treatment-timeline.md), [TASK-009](tasks/009-stage-details.md)

Goals:

- treatment overview
- timeline stages
- completed stages
- current stage
- upcoming stages
- stage details (display-only, except existing task completion)

---

## M5 — Local State and Persistence

Status: NOT STARTED

Tasks: [TASK-010](tasks/010-persist-task-completion.md)

Goals:

- persist task completion locally
- completions survive restart
- basic offline behavior for completions

State management technology should be selected only if this task (or an earlier concrete task) demonstrates the need. Do not install Redux, MobX, or Zustand speculatively.

---

## M6 — Symptom Diary

Status: NOT STARTED

Tasks: [TASK-011](tasks/011-diary-domain.md), [TASK-012](tasks/012-symptom-check-in.md), [TASK-013](tasks/013-symptom-history.md)

Goals:

- symptom check-in domain
- pain, swelling, heaviness, itching, burning
- feeling compared with previous day
- structural validation (not medical risk cutoffs)
- submission
- Diary tab (third primary section)
- Today check-in entry point when the protocol requests it
- symptom history

---

## M7 — Progress Photos

Status: NOT STARTED

Tasks: [TASK-014](tasks/014-photo-capture.md), [TASK-015](tasks/015-photo-gallery.md), [TASK-016](tasks/016-guided-capture.md)

Photos are a **capability**, not a primary navigation destination.

Goals:

- camera permission
- photo capture
- preview, retry, confirmation
- photo metadata
- treatment / stage association
- entry from Today, Diary, and/or Treatment stage details
- gallery on an existing product surface

Later in this milestone:

- guided capture
- standardized angle helper

**Not in M7:**

- dedicated Photos tab
- before / after comparison as a medical conclusion
- photo uploads (M9)

---

## M8 — Activity

Status: NOT STARTED

Tasks: [TASK-017](tasks/017-healthkit.md), [TASK-018](tasks/018-health-connect.md), [TASK-019](tasks/019-activity-today.md)

Goals:

iOS:

- HealthKit permission
- read daily steps

Android:

- Health Connect permission
- read daily steps

Then:

- display doctor-defined step target on Today
- Activity tab (fourth primary section)
- denied / unavailable states

The app must not invent a step goal. Targets come from the treatment protocol.

---

## Doctor section (mobile, mock)

Status: NOT STARTED

Task: [TASK-020](tasks/020-doctor-section.md)

Goals:

- clinic / doctor information
- upcoming appointments
- doctor-defined instructions as display text
- reachable Doctor section

Navigation placement is decided in TASK-020 Plan Mode against the shell that exists then.

Prefer keeping primary navigation around five sections:

- Today
- Treatment
- Diary
- Activity
- Doctor

Do not assume a sixth tab. Do not add a Photos tab.

---

## M9 — Backend Integration

Status: NOT STARTED (coarse)

Tasks: [TASK-021](tasks/021-api-client.md), [TASK-022](tasks/022-authentication.md), [TASK-023](tasks/023-remote-repositories.md)

These tasks **must be re-planned** and **may be split** before implementation once backend contracts exist.

Goals (indicative):

- environment configuration (first justified env work; deferred from M1)
- API client
- authentication infrastructure
- HTTP repository implementations
- patient / treatment / tasks / diary / photo upload / appointments APIs

Do not start this milestone before the local companion is useful.

Do not invent endpoints in the mobile app.

---

## M10 — Patient Onboarding

Status: NOT STARTED (coarse)

Task: [TASK-024](tasks/024-invite-deep-links.md)

This task **must be re-planned** and **may be split** before implementation once invite and linking contracts exist.

Goals (indicative):

- doctor invite
- QR / link
- deep linking (Universal Links / App Links)
- patient activation
- account recovery

The application scheme `doctormaslianski` already exists from M0.

---

## M11 — Notifications

Status: NOT STARTED (coarse)

Task: [TASK-025](tasks/025-notifications.md)

This task **must be re-planned** and **may be split** before implementation once notification contracts exist.

Goals (indicative):

- push token registration
- task reminders
- check-in reminders
- appointment reminders
- notification deep links

The app must not generate emergency medical alerts.

---

## M12 — Doctor Platform

Separate web application. Out of this repository.

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

Not in the current mobile backlog. Add as TASK-026+ only when approaching release.

Possible goals:

- crash reporting
- analytics
- performance review
- accessibility
- security review
- privacy review
- App Store preparation
- Google Play preparation
- production builds
