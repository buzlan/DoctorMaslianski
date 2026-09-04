# Doctor Maslianski

Doctor Maslianski is a React Native mobile application for patients of a phlebologist.

The current application name is temporary and may change in the future.

## Current product scope — Pilot MVP

The first real version is a **closed clinical product pilot**, not a general phlebology platform.

It supports **only** patients undergoing **sclerotherapy**.

Telangiectasia / spider veins is **not** a separate protocol or product path in this MVP.

It does **not** support all phlebology procedures.

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

A clinic review / assignment surface will live in a **separate repository**. It is not a protocol SaaS or a full doctor management platform. The doctor selects patient-specific actions from a predefined catalog, sets date ranges, appointments, periods, and completion.

## Core patient journey (Pilot MVP)

Clinic creates or opens the patient
→ Doctor assigns current treatment period, selected catalog actions with date ranges, and next appointment
→ Clinic issues invite / QR containing only a secure token (no medical payload)
→ Patient accepts privacy notice and pilot consent
→ Patient activates the invite and receives that patient-specific treatment
→ Patient sees today’s assigned actions
→ Patient completes assigned actions
→ Patient submits the daily diary once per civil date
→ Patient may upload up to three photos per civil date from Today
→ Patient sees current appointment, treatment period “День N”, visit history, and doctor-uploaded visit photos
→ Doctor may later add, disable, or change assignments and the appointment; history is kept
→ Doctor decides treatment is complete
→ Patient sees a completion screen (no main tabs) with clinic contact / booking
→ Clinic reviews structured follow-up in the separate review tool

## Core product concept

Treatment Timeline: clinical milestones / visits plus the current treatment period (“День N”).

Daily actions come from **patient-specific assignments** the doctor selects from a clinic-defined action catalog. They do not come from a frozen multi-stage protocol snapshot, and the app does not generate medical recommendations.

Exact clinical texts come from clinic-approved content only. Clinic-supplied drafts stay draft until explicitly approved for patient-facing use.

If medical thresholds are ever introduced, they must also be explicitly defined by the clinic. The Pilot MVP does not derive medical thresholds from patient data.

The software provides structure for displaying and collecting that information. It does not invent clinical protocols and does not include a protocol editor.

Historical completions, diary entries, photos, periods, visits, and superseded appointments must not be deleted when the doctor changes the current schedule.

See [docs/domain-model.md](docs/domain-model.md).

## Pilot patient surfaces

While treatment is **active**, primary navigation is exactly three tabs:

### Today (Сегодня)

The primary screen. Shows assignments active on the current civil date, completion of those assignments, a diary entry point if not yet submitted today, patient photo upload (max 3 per day), the current appointment, and clinic contact.

### Treatment (Лечение)

Milestones / visits, current period “День N” (Day 1 at period start; resets to Day 1 if the doctor starts a new period after a control visit), period/visit history, doctor-uploaded visit photos, and the current appointment.

Do not use a fixed mock such as “Preparation → Procedure → Day 1 → Day 7 → Control”.

### Diary (Дневник)

Once per civil date during the entire active treatment: pain VAS 0–10, swelling VAS 0–10, wellbeing Лучше / Без изменений / Хуже. History of submitted entries. After submit, not offered again until the next calendar day.

There is **no Photos tab**. Patient photos are uploaded from Today only; the patient has **no gallery** of their own photos. Doctor visit photos are viewed from Treatment.

There is **no fourth “Связь с доктором” tab**, **no Activity tab**, and **no Doctor tab**. HealthKit and Health Connect are post-MVP. Clinic contact and the next appointment live on Today and/or Treatment, and on the post-completion screen.

When the doctor marks treatment **complete**, main tabs are hidden. The patient sees a simple completion screen with a CTA to contact / book the clinic.

## Medical safety

The mobile application must not independently:

- diagnose a patient
- prescribe treatment
- change treatment
- determine medical thresholds
- give emergency medical conclusions
- invent protocol or catalog content
- claim the pilot proves clinical efficacy

Medical recommendations originate from a doctor or clinic-approved content. The doctor controls patient-specific assignments; the app only displays and collects.

The application may collect, display and structure patient information.

## Pilot data (conceptual)

The product model supports:

- Patient (including pilot cohort and consent/privacy acceptance)
- ActionCatalog (clinic content; draft until approved)
- Treatment (patient-specific; no protocol snapshot as the plan)
- TreatmentPeriod
- TreatmentMilestone
- ActionAssignment
- ActionCompletion
- DiaryEntry
- PatientPhoto
- DoctorMilestonePhoto
- Appointment (current + superseded history)
- FeedbackSurvey
- ProductEvent

`ProductEvent` is product analytics, not a duplicate clinical store. It must not contain raw diary answers, medical free text, photo URLs/content, diagnoses, or doctor notes.

Legacy ProductEvent fields `protocolKind` and `protocolVersion` described a versioned protocol snapshot. That context is **superseded**. Do **not** reinterpret `protocolVersion` as action-catalog version. Emitted events already omit that pair (TASK-041). Leftover unemitted `treatment_journey_completed` / `feedback_submitted` context is adapted in TASK-028.

Pilot metrics must be segmentable by pilot cohort so internal testers, closed-beta patients and clinic-pilot patients can be analyzed separately. The MVP has a single treatment context (sclerotherapy); do not require a telangiectasia segment.

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
- telangiectasia as a separate protocol/product path
- multiple selectable protocols
- protocol SaaS / editor
- multi-clinic SaaS
- HealthKit / Health Connect
- dedicated Photos tab
- dedicated Doctor / contact tab
- patient gallery of own submitted photos
- guided capture overlay
- complex analytics product
- runtime multi-language
- full doctor management platform

Push notifications **are in Pilot MVP scope** because the doctor can change assignments, appointments, and treatment completion. End-to-end push is after clinic-review writes exist (TASK-025 after TASK-034). Notification text must stay non-diagnostic.

## Technical foundation

- React Native
- Expo
- Expo Router
- TypeScript

Pilot shared data uses Supabase (Postgres, Auth, Storage, RLS).

Supabase infrastructure definitions such as database migrations, RLS policies, storage configuration, seed/invite tooling, and the clinic review application live in a separate pilot repository.

The React Native application contains environment configuration and a shared Supabase JS client (TASK-030). Patient auth session restore and the root auth gate are TASK-022. Authenticated product repositories sync through TASK-031. Patient photo upload is TASK-032.

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

Prefer explicit patient assignments, periods, and milestones over mutating a protocol snapshot. Do not mutate immutable historical treatment data. No speculative global state library.

## Current development stage

Pilot MVP — documentation aligned to clinic workflow (TASK-040 DONE).

Milestone 0 — Foundation is complete.
Milestone 1 — Application Foundation is complete (design tokens, UI primitives, Today + Treatment tabs).
Milestone 2 — Pilot domain types, mock repository, and protocol intake **as originally specified** are complete (TASK-026, 004, 005). That snapshot / two-protocol model is **superseded** by TASK-040. TASK-041 replaced snapshot types in code with patient-specific treatments, periods, and assignments.
Milestone 3 — ProductEvent port, Today, and in-memory assignment completion are complete (TASK-027, 006, 007).

Currently implemented (code):

- Expo project, TypeScript, Expo Router
- iOS and Android launch
- design tokens, UI primitives, Russian copy catalog
- three-tab shell while treatment is active: Today, Treatment, Diary
- patient-specific treatment domain + local persistence (assignments, periods, milestones, ActionCompletion overlay)
- Today: assignments active on the current civil date, period Day N, assignment completion, diary CTA, patient photo upload (max 3/day), current appointment, clinic contact
- Treatment timeline: period Day N, clinic-provided milestones, visit details, doctor milestone photos, current appointment
- Diary tab: once-per-civil-date form + submitted history
- ProductEvent local sink (`app_opened`, `task_completed`, diary/photo counts, `treatment_journey_completed`, `feedback_submitted` use patient/treatment ids + cohort; no snapshot protocol pair; `feedback_submitted` may include numeric usefulness/clarity only)
- completed-treatment shell: when `Treatment.status` is `completed`, main tabs are hidden; completion screen reuses clinic contact and optional local feedback survey
- Supabase public env + shared JS client in `src/core/` (no repository swap)
- Auth session foundation (TASK-022): persisted session restore, confirmed-only applySession/signOut, generation-based SecureStore, root auth gate. Unauthenticated → access screen; production unavailable → service-unavailable copy; `__DEV__` + missing env still uses local treatment shells.
- Remote repositories (TASK-031): authenticated sessions use Supabase behind existing ports (treatment, diary, clinic contact, doctor-photo metadata, feedback, ProductEvent insert) with a user-scoped FIFO outbox and process-local last-read snapshots. Patient photo bytes remain local until TASK-032. `__DEV__` without auth/env keeps local fixtures.

The development backlog lives in `docs/ROADMAP.md` and `docs/tasks/`. The next implementation task is **TASK-032** (photo upload to Supabase Storage).
