import type { PilotCohort } from '@/modules/treatment/domain';

export type { PilotCohort };

/** Leftover snapshot context on unemitted event types. Not catalog version. */
export type ProtocolKind = 'sclerotherapy' | 'telangiectasia';

export const DEVELOPMENT_PILOT_COHORT: PilotCohort = 'internal_dry_run';

export const PRODUCT_EVENT_NAMES = [
  'patient_invited',
  'patient_activated',
  'treatment_started',
  'task_scheduled',
  'task_completed',
  'checkin_requested',
  'checkin_submitted',
  'photo_checkpoint_requested',
  'photo_checkpoint_completed',
  'treatment_journey_completed',
  'feedback_submitted',
  'app_opened',
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export type ProductEventBase = {
  at: string;
  pilotCohort: PilotCohort;
};

export type TreatmentEventContext = ProductEventBase & {
  patientId: string;
  treatmentId: string;
  protocolKind: ProtocolKind;
  protocolVersion: number;
};

export type ProtocolAssignedContext = ProductEventBase & {
  patientId: string;
  protocolKind: ProtocolKind;
  protocolVersion: number;
  treatmentId?: string;
};

export type AppOpenedEvent =
  | ({ name: 'app_opened' } & ProductEventBase)
  | ({ name: 'app_opened' } & ProductEventBase & { patientId: string })
  | ({ name: 'app_opened' } & ProductEventBase & { patientId: string; treatmentId: string });

type PatientInvitedEvent = { name: 'patient_invited' } & ProtocolAssignedContext;

type PatientActivatedEvent = { name: 'patient_activated' } & ProtocolAssignedContext;

type TreatmentStartedEvent = { name: 'treatment_started' } & TreatmentEventContext;

type TreatmentJourneyCompletedEvent = {
  name: 'treatment_journey_completed';
} & TreatmentEventContext;

type EntityTreatmentEvent = TreatmentEventContext & {
  entityId: string;
};

type TaskScheduledEvent = { name: 'task_scheduled' } & EntityTreatmentEvent;
type TaskCompletedEvent = ProductEventBase & {
  name: 'task_completed';
  patientId: string;
  treatmentId: string;
  entityId: string;
};
/**
 * Structural check-in analytics only. entityId is diaryEntryIdFor(treatmentId, civilDate).
 * Product metrics must deduplicate checkin_requested by entityId (and treatmentId),
 * not by raw event row count: a process restart may append another requested event.
 */
type CheckinRequestedEvent = ProductEventBase & {
  name: 'checkin_requested';
  patientId: string;
  treatmentId: string;
  entityId: string;
};
type CheckinSubmittedEvent = ProductEventBase & {
  name: 'checkin_submitted';
  patientId: string;
  treatmentId: string;
  entityId: string;
};
type PhotoCheckpointRequestedEvent = {
  name: 'photo_checkpoint_requested';
} & EntityTreatmentEvent;
type PhotoCheckpointCompletedEvent = {
  name: 'photo_checkpoint_completed';
} & EntityTreatmentEvent;

type FeedbackSubmittedEvent = {
  name: 'feedback_submitted';
  usefulnessScore?: number;
  clarityScore?: number;
} & TreatmentEventContext;

export type ProductEvent =
  | AppOpenedEvent
  | PatientInvitedEvent
  | PatientActivatedEvent
  | TreatmentStartedEvent
  | TreatmentJourneyCompletedEvent
  | TaskScheduledEvent
  | TaskCompletedEvent
  | CheckinRequestedEvent
  | CheckinSubmittedEvent
  | PhotoCheckpointRequestedEvent
  | PhotoCheckpointCompletedEvent
  | FeedbackSubmittedEvent;
