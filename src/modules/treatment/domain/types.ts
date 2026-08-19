import type { CalendarDate } from './calendar-date';

export type ProtocolKind = 'sclerotherapy' | 'telangiectasia';

export type PilotCohort = 'internal_dry_run' | 'closed_beta' | 'clinic_pilot';

export type TreatmentStatus = 'active' | 'completed' | 'cancelled';

export type Patient = {
  id: string;
  cohort?: PilotCohort;
  privacyAcceptedAt?: string;
  pilotConsentAcceptedAt?: string;
  consentDocumentVersion?: string;
};

export type ProtocolStage = {
  id: string;
  order: number;
  title?: string;
  summary?: string;
  timingRule?: string;
  startDayOffset?: number;
  endDayOffset?: number;
};

export type ProtocolTask = {
  id: string;
  stageId: string;
  title?: string;
  instruction?: string;
  scheduleRule?: string;
  dayOffsets: readonly number[];
};

export type CheckInDefinition = {
  id: string;
  stageId?: string;
};

export type PhotoCheckpoint = {
  id: string;
  stageId?: string;
  title?: string;
  when?: string;
  captureNotes?: string;
};

export type Restriction = {
  id: string;
  title?: string;
  instruction?: string;
  appliesWhen?: string;
};

export type AppointmentPatternItem = {
  id: string;
  label?: string;
  when?: string;
};

export type ProtocolContent = {
  kind: ProtocolKind;
  version: number;
  stages: readonly ProtocolStage[];
  tasks: readonly ProtocolTask[];
  checkInDefinitions: readonly CheckInDefinition[];
  photoCheckpoints: readonly PhotoCheckpoint[];
  restrictions: readonly Restriction[];
  appointmentPattern: readonly AppointmentPatternItem[];
};

export type PilotProtocol = ProtocolContent & {
  id: string;
};

export type TreatmentSnapshot = ProtocolContent;

export type Treatment = {
  id: string;
  patientId: string;
  protocolId: string;
  protocolVersion: number;
  snapshot: TreatmentSnapshot;
  startDate: CalendarDate;
  status: TreatmentStatus;
};

export type ProgressSummary = {
  stageCount: number;
  currentStageId: string | null;
  currentStageOrder: number | null;
  taskCount: number;
  completedTaskCount: number;
};
