# Doctor Maslianski — Pilot MVP Roadmap

This roadmap describes the Pilot MVP order of development.

Individual implementation work is defined in separate files inside `docs/tasks`.

Do not implement a later milestone during an earlier task.

The application must remain runnable after every completed task.

This MVP is a product validation pilot. It must not claim to prove clinical efficacy.

---

## Locked product decisions

- **Pilot protocols only:** sclerotherapy and telangiectasias / spider veins.
- **UI language:** Russian strings. Typed copy catalog so English can be added later. No i18n library until a second language is switched at runtime.
- **Primary navigation:** Today, Treatment, Diary.
- **Progress photos** are a capability from Today, Diary, and/or Treatment stage details. No Photos tab.
- **No Activity tab. No Doctor tab.** Clinic contact and next appointment live on existing surfaces.
- **HealthKit / Health Connect:** post-MVP (TASK-016 is also post-MVP: guided capture).
- **PilotProtocol is versioned.** A Treatment keeps the assigned protocol version and an immutable snapshot.
- **Consent / privacy acceptance** is recorded (timestamps + document version) before real-patient use.
- **ProductEvent** is product analytics, not a clinical duplicate store.
- **Metrics** segment by protocol kind and pilot cohort. Internal testers must not contaminate real-patient metrics.
- **Backend:** Supabase. Clinic review lives in a **separate repository**.
- **Environment configuration** starts with the Supabase client (TASK-030 / M9), not in M1.
- Medical recommendations and thresholds originate from a doctor or clinic-authored protocol.

---

## Task index

- **M0 — Project Foundation:** [TASK-000](tasks/000-foundation.md) — DONE
- **M1 — Application Foundation:** [001](tasks/001-design-tokens.md), [002](tasks/002-ui-primitives.md), [003](tasks/003-navigation-shell.md)
- **M2 — Pilot domain:** [026](tasks/026-protocol-intake.md), [004](tasks/004-treatment-domain.md), [005](tasks/005-mock-repository.md)
- **M3 — Today:** [027](tasks/027-product-events.md) (port), [006](tasks/006-today-screen.md), [007](tasks/007-task-completion.md)
- **M4 — Treatment Timeline:** [008](tasks/008-treatment-timeline.md), [009](tasks/009-stage-details.md)
- **M5 — Local persistence:** [010](tasks/010-persist-task-completion.md)
- **M6 — Symptom Diary:** [011](tasks/011-diary-domain.md), [012](tasks/012-symptom-check-in.md), [013](tasks/013-symptom-history.md)
- **M7 — Progress Photos:** [014](tasks/014-photo-capture.md), [015](tasks/015-photo-gallery.md)
- **M8 — Pilot companion completeness:** [020](tasks/020-clinic-contact.md), [028](tasks/028-feedback-survey.md)
- **M9 — Supabase + sync:** [029](tasks/029-supabase-schema.md), [030](tasks/030-supabase-client.md), [022](tasks/022-authentication.md), [031](tasks/031-sync.md), [032](tasks/032-photo-upload.md)
- **M10 — Pilot access:** [033](tasks/033-pilot-invite.md)
- **M11 — Clinic review (other repo):** [034](tasks/034-clinic-review.md)
- **M12 — Measurement / validation:** [035](tasks/035-pilot-metrics.md)
- **M13 — Pilot readiness & distribution:** [036](tasks/036-eas-internal.md), [037](tasks/037-testflight-play.md), [038](tasks/038-privacy.md)
- **M14 — Pilot rollout:** Phases 1–3 (operational)
- **M15 — Evaluation:** Phase 4
- **M16 — Public store release:** [039](tasks/039-store-release.md) — only if M15 justifies public release

**Aliases (do not implement separately):** [021](tasks/021-api-client.md) → 030, [023](tasks/023-remote-repositories.md) → 031, [024](tasks/024-invite-deep-links.md) → 033

**POST-MVP (not in Pilot MVP):** [016](tasks/016-guided-capture.md), [017](tasks/017-healthkit.md), [018](tasks/018-health-connect.md), [019](tasks/019-activity-today.md), [025](tasks/025-notifications.md)

Suggested implementation order:

001 → 002 → 003 → 026 → 004 → 005 → 027 → 006 → 007 → 008 → 009 → 010 → 011 → 012 → 013 → 014 → 015 → 020 → 028 → 029 → 030 → 022 → 031 → 032 → 033 → 034 → 035 → 036 → 037 → 038 → rollout → 039

Do not start TASK-021, TASK-023, or TASK-024. They are aliases of 030, 031, and 033.

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

- design tokens
- basic UI primitives
- navigation shell: Today and Treatment tabs (Diary added in M6)
- Russian copy catalog (no i18n library)

No medical/product functionality yet.

**Not in M1:** environment configuration, API client, empty product modules, Diary/Activity/Doctor tabs, Photos tab.

---

## M2 — Pilot domain

Status: NOT STARTED

Tasks: [TASK-026](tasks/026-protocol-intake.md), [TASK-004](tasks/004-treatment-domain.md), [TASK-005](tasks/005-mock-repository.md)

Goals:

- clinic-authored protocol intake for sclerotherapy and telangiectasia (versioned)
- Patient, PilotProtocol, Treatment, TreatmentStage, TreatmentTask models
- Treatment stores protocol version and immutable snapshot
- unit test harness
- mock repository with two versioned protocol fixtures
- one active treatment

Engineering does not invent clinical content. No backend yet.

---

## M3 — Today

Status: NOT STARTED

Tasks: [TASK-027](tasks/027-product-events.md), [TASK-006](tasks/006-today-screen.md), [TASK-007](tasks/007-task-completion.md)

Goals:

- ProductEvent port (local sink; privacy boundary)
- patient Today screen from the assigned snapshot
- current treatment stage, today's tasks, next appointment
- loading / empty / error
- in-memory task completion
- no walking / activity goal

---

## M4 — Treatment Timeline

Status: NOT STARTED

Tasks: [TASK-008](tasks/008-treatment-timeline.md), [TASK-009](tasks/009-stage-details.md)

Goals:

- timeline from the treatment snapshot
- completed / current / upcoming stages
- stage details (display-only except existing task completion)

---

## M5 — Local State and Persistence

Status: NOT STARTED

Tasks: [TASK-010](tasks/010-persist-task-completion.md)

Goals:

- persist task completion locally
- completions survive restart
- offline-friendly writes until sync exists

Do not install a global state library speculatively.

---

## M6 — Symptom Diary

Status: NOT STARTED

Tasks: [TASK-011](tasks/011-diary-domain.md), [TASK-012](tasks/012-symptom-check-in.md), [TASK-013](tasks/013-symptom-history.md)

Goals:

- check-in domain using **protocol-defined** questions
- structural validation only (not medical risk cutoffs)
- Diary tab (third and final primary nav for the pilot)
- Today entry point when the snapshot requests a check-in
- history

---

## M7 — Progress Photos

Status: NOT STARTED

Tasks: [TASK-014](tasks/014-photo-capture.md), [TASK-015](tasks/015-photo-gallery.md)

Photos are a capability, not a tab. Guided capture is post-MVP.

Goals:

- permission, capture, preview, retry, confirm
- metadata and treatment/stage association
- entry from Today, Diary, and/or stage details
- gallery on an existing surface
- local save; uploads in TASK-032

---

## M8 — Pilot companion completeness

Status: NOT STARTED

Tasks: [TASK-020](tasks/020-clinic-contact.md), [TASK-028](tasks/028-feedback-survey.md)

Goals:

- clinic / doctor contact and next appointment on Today and/or Treatment
- end-of-treatment feedback survey (usefulness + clarity)
- ProductEvent instrumentation continues (no clinical payloads)

No Doctor tab.

---

## M9 — Supabase + sync

Status: NOT STARTED

Tasks: [TASK-029](tasks/029-supabase-schema.md), [TASK-030](tasks/030-supabase-client.md), [TASK-022](tasks/022-authentication.md), [TASK-031](tasks/031-sync.md), [TASK-032](tasks/032-photo-upload.md)

TASK-021 is an alias of TASK-030. TASK-023 is an alias of TASK-031. **Do not implement 021 or 023 separately.**

Goals:

- Supabase schema, RLS, storage (other repo): protocol versions, treatment snapshots, consent fields, event segmentation
- mobile env + Supabase client
- auth session
- remote repositories + offline queue
- photo upload

Required before real patients. Prefer this before Phase 1 so clinic review and events can be exercised.

---

## M10 — Pilot access

Status: NOT STARTED

Tasks: [TASK-033](tasks/033-pilot-invite.md)

TASK-024 is an alias of TASK-033. **Do not implement 024 separately.**

Goals:

- clinic-issued invite
- assign protocol version + snapshot + pilot cohort
- record privacy acceptance and pilot consent
- optional deep links later if needed

---

## M11 — Clinic review

Status: NOT STARTED

Task: [TASK-034](tasks/034-clinic-review.md)

Lives in a **separate repository** (`doctor-maslianski-pilot`). This repo documents the contract only.

Goals:

- Patients → Patient → timeline, tasks, check-ins, photos, feedback
- invite + assign protocol version + cohort
- show protocol version on the treatment
- no silent rewrite of existing treatments
- not a doctor SaaS

---

## M12 — Measurement / validation

Status: NOT STARTED

Task: [TASK-035](tasks/035-pilot-metrics.md)

Goals:

- metrics catalog (no hardcoded success thresholds in app logic)
- event coverage check
- segment by protocol kind and cohort
- Phase 3/4 queries exclude `internal_dry_run`

Finalize numeric thresholds before Phase 3, in a metrics document.

---

## M13 — Pilot readiness & distribution

Status: NOT STARTED

Tasks: [TASK-036](tasks/036-eas-internal.md), [TASK-037](tasks/037-testflight-play.md), [TASK-038](tasks/038-privacy.md)

TASK-038 is a prerequisite for real-patient Phase 2 (Closed Beta). Complete privacy, consent UX, health-data disclosures, and retention readiness before inviting real patients.

Goals:

- EAS development builds and internal distribution
- iOS TestFlight
- Google Play internal / closed testing
- privacy / consent / retention readiness
- real-patient beta uses official testing tracks, not sideload-only

---

## M14 — Pilot rollout

Status: NOT STARTED (operational)

These are product-discovery sample sizes, not clinical statistical significance.

Eligibility (sclerotherapy or telangiectasia only) is a **clinic decision**, not an app diagnosis.

### Phase 1 — Internal dry run

Approximately 2–3 testers. Goal: workflow and technical issues.

Cohort: `internal_dry_run`. Prefer M9+ already on. These accounts must remain filterable out of Phase 3 evaluation.

### Phase 2 — Closed beta

Approximately 5–10 real eligible patients. Goal: usability and early qualitative feedback.

Cohort: `closed_beta`. Requires invite, recorded consent/privacy acceptance (TASK-038 complete), TestFlight/Play tracks.

### Phase 3 — Clinic pilot

Approximately 20–30 eligible patients. Goal: measure agreed product metrics and collect patient/clinic feedback.

Cohort: `clinic_pilot`. Thresholds frozen before this phase. Do not mix Phase 1 events into these totals.

---

## M15 — Evaluation

Status: NOT STARTED (operational)

### Phase 4 — Evaluation

Compare metrics with predefined success criteria (from TASK-035, not from app logic) and decide:

- stop
- iterate
- expand to additional protocols

Exclude internal testers from real-patient totals.

---

## M16 — Public store release

Status: NOT STARTED

Task: [TASK-039](tasks/039-store-release.md) only

Development completion is not the end of the MVP. Public App Store / Google Play submission happens **only if M15 evaluation says proceed**.

Goals:

- store screenshots / Russian metadata
- production EAS
- App Store submission
- Google Play submission

Privacy and consent work is not in this milestone; it belongs to TASK-038 in M13 and must already be done before Phase 2.

---

## Post-MVP (not in Pilot MVP)

- [TASK-016](tasks/016-guided-capture.md) — guided capture overlay
- [TASK-017](tasks/017-healthkit.md) — HealthKit
- [TASK-018](tasks/018-health-connect.md) — Health Connect
- [TASK-019](tasks/019-activity-today.md) — Activity on Today / Activity tab
- [TASK-025](tasks/025-notifications.md) — push notifications

A full doctor management platform remains a separate future application, larger than TASK-034.
