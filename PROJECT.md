# Doctor Maslianski

Doctor Maslianski is a React Native mobile application for patients of a phlebologist.

The current application name is temporary and may change in the future.

## Current product scope — Pilot MVP

The first real version is a **closed clinical product pilot**, not a general phlebology platform.

It supports **only** patients undergoing:

- sclerotherapy
- treatment of telangiectasias / spider veins

It does **not** support all phlebology procedures in this MVP.

The purpose is to validate whether structured mobile follow-up is useful for real patients and the clinic.

Core hypothesis (product, not clinical):

A patient who receives a clear digital treatment plan, daily/relevant tasks, symptom check-ins and structured photo follow-up will better understand what to do between visits, while the clinic will receive more structured follow-up information.

This MVP is a product validation pilot. It must **not** claim to prove clinical efficacy.

## Product purpose

The website maslianski.by is responsible for attracting and informing patients.

The mobile application is intended to accompany a patient after consultation and throughout the assigned pilot treatment.

The application should answer the patient's main daily question:

"What should I do today?" / "Что делать сегодня?"

## Primary user

Patient.

A minimal clinic review surface will live in a **separate repository**. It is not a doctor SaaS dashboard.

## Core patient journey (Pilot MVP)

Clinic invites eligible patient and assigns a versioned protocol
→ Patient accepts privacy notice and pilot consent
→ Patient receives that protocol snapshot as one active treatment plan
→ Patient sees today's actions
→ Patient completes doctor-defined tasks
→ Patient submits protocol-defined check-ins
→ Patient submits structured progress photos
→ Patient sees upcoming control appointment and clinic contact
→ Patient submits end-of-treatment feedback
→ Clinic reviews structured follow-up in the separate review tool

## Core product concept

Treatment Timeline.

Stages, tasks, recommendations, timing, check-in questions, photo checkpoints and restrictions must originate from the doctor / clinic.

If medical thresholds are ever introduced, they must also be explicitly defined by the clinic. The Pilot MVP does not derive medical thresholds from patient data.

The software provides structure for displaying and collecting that information. It does not invent clinical protocols.

A `PilotProtocol` is **versioned**. A `Treatment` stores the assigned **protocol version and an immutable snapshot**, so later clinic edits cannot silently change an existing patient's journey.

## Pilot patient surfaces

Primary navigation is three sections:

### Today

The primary screen. Shows only what is relevant today: current stage, today's tasks, check-in or photo request when the protocol asks, next appointment, clinic contact.

### Treatment

Treatment Timeline and stage details from the assigned protocol snapshot.

### Diary

Protocol-defined check-ins and check-in history.

Progress photos are a **capability** reached from Today, Treatment stage details, and/or Diary. There is **no Photos tab**.

There is **no Activity tab** and **no Doctor tab** in the Pilot MVP. HealthKit and Health Connect are post-MVP. Basic doctor/clinic contact and the next appointment appear on Today and/or Treatment.

## Medical safety

The mobile application must not independently:

- diagnose a patient
- prescribe treatment
- change treatment
- determine medical thresholds
- give emergency medical conclusions
- invent protocol content
- claim the pilot proves clinical efficacy

Medical recommendations originate from a doctor or a doctor-defined treatment protocol.

The application may collect, display and structure patient information.

## Pilot data (conceptual)

The product model supports:

- Patient (including pilot cohort and consent/privacy acceptance)
- PilotProtocol (versioned)
- Treatment (protocol version + immutable snapshot)
- TreatmentStage
- TreatmentTask
- CheckIn
- PhotoEntry
- Appointment
- FeedbackSurvey
- ProductEvent

`ProductEvent` is product analytics, not a duplicate clinical store. It must not contain raw check-in answers, medical free text, photo URLs/content, diagnoses, or doctor notes.

Pilot metrics must be segmentable by protocol type and pilot cohort so internal testers, closed-beta patients and clinic-pilot patients can be analyzed separately.

Real-patient data cannot exist only on one phone. The Pilot MVP uses **Supabase** for shared storage. This repository remains the Expo / React Native patient app.

## Pilot consent

Before real-patient use, the app records at least:

- privacy acceptance timestamp
- pilot participation consent timestamp
- consent/privacy document version

Exact legal UX is finalized in the privacy task. The data model and onboarding must persist these fields.

## Out of scope for the Pilot MVP

- AI diagnosis or AI treatment recommendations
- chat
- billing
- all phlebology procedures
- multi-clinic SaaS
- HealthKit / Health Connect
- dedicated Photos tab
- dedicated Doctor tab
- guided capture overlay
- push notifications
- complex analytics product
- runtime multi-language
- full doctor management platform

## Technical foundation

- React Native
- Expo
- Expo Router
- TypeScript

Pilot shared data uses Supabase (Postgres, Auth, Storage, RLS).

Supabase infrastructure definitions such as database migrations, RLS policies, storage configuration, seed/invite tooling, and the clinic review application live in a separate pilot repository.

The React Native application in this repository will later contain its own Supabase client integration and environment configuration when the corresponding Pilot MVP task is implemented.

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

Pilot MVP — Milestone 1 — Application Foundation.

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
