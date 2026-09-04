# Doctor Maslianski — Pilot MVP Roadmap

This roadmap describes the Pilot MVP order of development.

Individual implementation work is defined in separate files inside `docs/tasks`.

Do not implement a later milestone during an earlier task.

The application must remain runnable after every completed task.

This MVP is a product validation pilot. It must not claim to prove clinical efficacy.

The conceptual domain is specified in [docs/domain-model.md](domain-model.md).

---

## Locked product decisions

- **Pilot treatment context:** sclerotherapy only. Telangiectasia / spider veins is not a separate protocol or product path.
- **No protocol SaaS / editor** and no patient-selectable protocol list.
- **Doctor-controlled assignments:** predefined action catalog; doctor selects items with date ranges; later add / disable / change; historical completions are not deleted.
- **UI language:** Russian strings. Typed copy catalog so English can be added later. No i18n library until a second language is switched at runtime.
- **Primary navigation while treatment is active:** Today, Treatment, Diary. After doctor-marked completion: no main tabs; completion screen with clinic contact / booking.
- **Patient photos** from Today, max 3 per civil day, no patient gallery of own photos. **Doctor milestone photos** viewed from Treatment (TASK-015). No Photos tab.
- **No Activity tab. No Doctor / contact tab.** Clinic contact and next appointment live on existing surfaces (and the completion screen).
- **HealthKit / Health Connect:** post-MVP (TASK-016 is also post-MVP: guided capture).
- **Patient-specific treatment records** (periods, milestones, assignments, completions). The TASK-004/005 immutable protocol snapshot is **superseded** and must not be extended as the plan of care.
- **Consent / privacy acceptance** is recorded (timestamps + document version) before real-patient use.
- **ProductEvent** is product analytics, not a clinical duplicate store. Legacy `protocolKind` / `protocolVersion` snapshot context is **superseded**; do not reinterpret `protocolVersion` as catalog version.
- **Metrics** segment by pilot cohort. Internal testers must not contaminate real-patient metrics. Do not require a two-protocol-kind split.
- **Backend:** Supabase. Clinic review lives in a **separate repository** and performs assignment / appointment / period / completion writes (not a protocol editor).
- **Environment configuration** starts with the Supabase client (TASK-030 / M9), not in M1.
- Medical recommendations and thresholds originate from a doctor or clinic-approved content. The app does not generate them.
- **Push notifications are in Pilot MVP** (TASK-025) to notify the patient of doctor-side changes. End-to-end implementation is **after TASK-034** so it can be verified against real clinic-side writes.

---

## Task index

- **M0 — Project Foundation:** [TASK-000](tasks/000-foundation.md) — DONE
- **M1 — Application Foundation:** [001](tasks/001-design-tokens.md), [002](tasks/002-ui-primitives.md), [003](tasks/003-navigation-shell.md)
- **M2 — Pilot domain:** [026](tasks/026-protocol-intake.md), [004](tasks/004-treatment-domain.md), [005](tasks/005-mock-repository.md) — DONE as originally specified (snapshot model; **superseded**). Alignment: [040](tasks/040-clinic-workflow-alignment.md). Code follow-on: [041](tasks/041-patient-treatment-domain.md)
- **M3 — Today:** [027](tasks/027-product-events.md) (port), [006](tasks/006-today-screen.md), [007](tasks/007-task-completion.md)
- **M4 — Treatment Timeline:** [008](tasks/008-treatment-timeline.md), [009](tasks/009-stage-details.md)
- **M5 — Local persistence:** [010](tasks/010-persist-task-completion.md)
- **M6 — Symptom Diary:** [011](tasks/011-diary-domain.md), [012](tasks/012-symptom-check-in.md), [013](tasks/013-symptom-history.md)
- **M7 — Photos:** [014](tasks/014-photo-capture.md) (patient upload), [015](tasks/015-photo-gallery.md) (doctor milestone photos on Treatment)
- **M8 — Pilot companion completeness:** [020](tasks/020-clinic-contact.md), [028](tasks/028-feedback-survey.md)
- **M9 — Supabase + sync:** [029](tasks/029-supabase-schema.md), [030](tasks/030-supabase-client.md), [022](tasks/022-authentication.md), [031](tasks/031-sync.md), [032](tasks/032-photo-upload.md)
- **M10 — Pilot access:** [033](tasks/033-pilot-invite.md)
- **M11 — Clinic review (other repo):** [034](tasks/034-clinic-review.md)
- **M11b — Doctor-change push:** [025](tasks/025-notifications.md) — after TASK-034
- **M12 — Measurement / validation:** [035](tasks/035-pilot-metrics.md)
- **M13 — Pilot readiness & distribution:** [036](tasks/036-eas-internal.md), [037](tasks/037-testflight-play.md), [038](tasks/038-privacy.md)
- **M14 — Pilot rollout:** Phases 1–3 (operational)
- **M15 — Evaluation:** Phase 4
- **M16 — Public store release:** [039](tasks/039-store-release.md) — only if M15 justifies public release

**Aliases (do not implement separately):** [021](tasks/021-api-client.md) → 030, [023](tasks/023-remote-repositories.md) → 031, [024](tasks/024-invite-deep-links.md) → 033

**POST-MVP (not in Pilot MVP):** [016](tasks/016-guided-capture.md), [017](tasks/017-healthkit.md), [018](tasks/018-health-connect.md), [019](tasks/019-activity-today.md)

Suggested implementation order:

001 → 002 → 003 → 026 → 004 → 005 → 027 → 006 → **040 → 041 → 007** → 008 → 009 → 010 → 011 → 012 → 013 → 014 → 015 → 020 → 028 → 029 → 030 → 022 → 031 → 032 → 033 → 034 → **025** → 035 → 036 → 037 → 038 → rollout → 039

Do not start TASK-021, TASK-023, or TASK-024. They are aliases of 030, 031, and 033.

Do not start TASK-007 until TASK-041 is done. Do not start end-to-end TASK-025 until TASK-034 can produce doctor-side writes.

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

Status: DONE

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

Status: IN PROGRESS (040 DONE; 041 NOT STARTED)

Tasks: [TASK-026](tasks/026-protocol-intake.md), [TASK-004](tasks/004-treatment-domain.md), [TASK-005](tasks/005-mock-repository.md), [TASK-040](tasks/040-clinic-workflow-alignment.md), [TASK-041](tasks/041-patient-treatment-domain.md)

Goals:

- clinic-authored sclerotherapy content intake (action catalog + standing rules; still draft until approved)
- TASK-026 / 004 / 005 delivered the original two-protocol snapshot model and remain historically correct
- TASK-040 supersedes that product model in documentation
- TASK-041 replaces snapshot types in code with patient assignments, periods, and milestones
- unit test harness
- mock repository with one active sclerotherapy treatment
- no backend yet

Engineering does not invent clinical content.

---

## M3 — Today

Status: IN PROGRESS (027 and 006 DONE; 007 blocked on 041)

Tasks: [TASK-027](tasks/027-product-events.md), [TASK-006](tasks/006-today-screen.md), [TASK-007](tasks/007-task-completion.md)

Goals:

- ProductEvent port (local sink; privacy boundary). Legacy protocol snapshot event context is superseded; do not reuse `protocolVersion` as catalog version
- patient Today screen from **assignments active today** (after 041)
- current period / Day N as needed, today’s assignments, next appointment (appointment display may complete in TASK-020)
- loading / empty / error
- in-memory assignment completion (TASK-007)
- no walking / activity goal

---

## M4 — Treatment Timeline

Status: NOT STARTED

Tasks: [TASK-008](tasks/008-treatment-timeline.md), [TASK-009](tasks/009-stage-details.md)

Goals:

- timeline of clinical milestones / visits plus current treatment period “День N”
- previous periods and visits remain in history
- visit details (display-only except existing assignment completion); doctor photos land in TASK-015
- no app-generated medical commentary
- do not use the old fixed mock stage list

---

## M5 — Local State and Persistence

Status: NOT STARTED

Tasks: [TASK-010](tasks/010-persist-task-completion.md)

Goals:

- persist assignment completions locally
- completions survive restart
- offline-friendly writes until sync exists

Do not install a global state library speculatively.

---

## M6 — Symptom Diary

Status: NOT STARTED

Tasks: [TASK-011](tasks/011-diary-domain.md), [TASK-012](tasks/012-symptom-check-in.md), [TASK-013](tasks/013-symptom-history.md)

Goals:

- diary domain with clinic-confirmed fields: pain VAS 0–10, swelling VAS 0–10, categorical wellbeing
- once per civil date during the entire active treatment
- structural validation only (not medical risk cutoffs)
- Diary tab (third and final primary nav while treatment is active)
- Today entry point when today’s diary is not yet submitted
- history without trend-based medical conclusions

---

## M7 — Photos

Status: NOT STARTED

Tasks: [TASK-014](tasks/014-photo-capture.md), [TASK-015](tasks/015-photo-gallery.md)

Two distinct flows. Guided capture is post-MVP. No Photos tab.

Goals:

- TASK-014: patient upload from Today; permission, capture/pick, preview, retry, confirm; max 3 per civil day; no patient gallery of own photos
- TASK-015: patient views doctor-uploaded milestone / visit photos from Treatment
- local save; uploads in TASK-032

---

## M8 — Pilot companion completeness

Status: NOT STARTED

Tasks: [TASK-020](tasks/020-clinic-contact.md), [TASK-028](tasks/028-feedback-survey.md)

Goals:

- clinic / doctor contact and current next appointment on Today and/or Treatment
- doctor-marked treatment completion: hide main tabs; completion screen with contact / booking CTA
- end-of-treatment feedback survey (usefulness + clarity) on that completion state
- ProductEvent instrumentation continues (no clinical payloads)

No Doctor tab.

---

## M9 — Supabase + sync

Status: NOT STARTED

Tasks: [TASK-029](tasks/029-supabase-schema.md), [TASK-030](tasks/030-supabase-client.md), [TASK-022](tasks/022-authentication.md), [TASK-031](tasks/031-sync.md), [TASK-032](tasks/032-photo-upload.md)

TASK-021 is an alias of TASK-030. TASK-023 is an alias of TASK-031. **Do not implement 021 or 023 separately.**

Goals:

- Supabase schema, RLS, storage (other repo): patient assignments, periods, milestones, completions, diary, two photo kinds, appointment history, consent fields, event segmentation (without legacy snapshot semantics)
- mobile env + Supabase client
- auth session
- remote repositories + offline queue; doctor-side schedule changes apply without deleting history
- photo upload for patient photos and doctor milestone photos as distinct objects

Required before real patients. Prefer this before Phase 1 so clinic review and events can be exercised.

Backend/mobile **prerequisites** for push (token registration, payload shape) may be prepared here or in TASK-033, but **end-to-end TASK-025 waits until after TASK-034**.

---

## M10 — Pilot access

Status: NOT STARTED

Tasks: [TASK-033](tasks/033-pilot-invite.md)

TASK-024 is an alias of TASK-033. **Do not implement 024 separately.**

Goals:

- clinic-issued invite / QR containing **only** a secure token or link, not medical data
- patient activates and receives already-assigned period, actions, and appointment
- assign **pilot cohort**: `internal_dry_run` | `closed_beta` | `clinic_pilot`
- record **privacy acceptance timestamp**, **pilot participation consent timestamp**, and **consent/privacy document version**

---

## M11 — Clinic review

Status: NOT STARTED

Task: [TASK-034](tasks/034-clinic-review.md)

Lives in a **separate repository** (`doctor-maslianski-pilot`). This repo documents the contract only.

Goals:

- Patients → Patient → timeline, assignments/completions, diary, patient photos, doctor photos, feedback
- writes: assign/disable actions and date ranges, set/edit appointment, attach doctor photos to milestones, start a new period after control, mark treatment complete, generate invite token
- no silent delete of history
- not a protocol SaaS / editor

---

## M11b — Doctor-change push notifications

Status: NOT STARTED

Task: [TASK-025](tasks/025-notifications.md)

Depends on **TASK-034** (clinic-side writes must exist so the workflow is verifiable). May use token/session work from M9/M10.

Goals:

- notify the patient when the doctor changes relevant assignments, the appointment, and possibly treatment completion
- notification text is non-diagnostic and avoids unnecessary medical details
- not a generic reminder platform and not emergency medical alerts

---

## M12 — Measurement / validation

Status: NOT STARTED

Task: [TASK-035](tasks/035-pilot-metrics.md)

Goals:

- metrics catalog (no hardcoded success thresholds in app logic)
- event coverage check
- segment by cohort (sclerotherapy is the only MVP context)
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

Eligibility (sclerotherapy only) is a **clinic decision**, not an app diagnosis.

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
- expand (for example additional treatment contexts)

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

A full doctor management platform remains a separate future application, larger than TASK-034.
