import {
  PRODUCT_EVENT_NAMES,
  type ProductEvent,
  type ProductEventName,
} from './types';

const PRODUCT_EVENT_NAME_SET = new Set<string>(PRODUCT_EVENT_NAMES);

const PROTOCOL_KINDS = new Set(['sclerotherapy', 'telangiectasia']);
const PILOT_COHORTS = new Set(['internal_dry_run', 'closed_beta', 'clinic_pilot']);

const ISO_8601_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const BASE_KEYS = ['name', 'at', 'pilotCohort'] as const;
const TREATMENT_CONTEXT_KEYS = [
  'patientId',
  'treatmentId',
  'protocolKind',
  'protocolVersion',
] as const;

const APP_OPENED_KEYS = new Set([
  ...BASE_KEYS,
  'patientId',
  'treatmentId',
  'protocolKind',
  'protocolVersion',
]);

const PROTOCOL_ASSIGNED_KEYS = new Set([
  ...BASE_KEYS,
  'patientId',
  'protocolKind',
  'protocolVersion',
  'treatmentId',
]);

const TREATMENT_EVENT_KEYS = new Set([...BASE_KEYS, ...TREATMENT_CONTEXT_KEYS]);

const ENTITY_EVENT_KEYS = new Set([...TREATMENT_EVENT_KEYS, 'entityId']);

const FEEDBACK_EVENT_KEYS = new Set([
  ...TREATMENT_EVENT_KEYS,
  'usefulnessScore',
  'clarityScore',
]);

const PROTOCOL_ASSIGNED_NAMES = new Set<ProductEventName>([
  'patient_invited',
  'patient_activated',
]);

const TREATMENT_NAMES = new Set<ProductEventName>([
  'treatment_started',
  'treatment_journey_completed',
]);

const ENTITY_NAMES = new Set<ProductEventName>([
  'task_scheduled',
  'task_completed',
  'checkin_requested',
  'checkin_submitted',
  'photo_checkpoint_requested',
  'photo_checkpoint_completed',
]);

export class InvalidProductEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProductEventError';
  }
}

export function assertValidProductEvent(input: unknown): ProductEvent {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new InvalidProductEventError('unsupported event field: name');
  }

  const record = input as Record<string, unknown>;
  const name = record.name;

  if (typeof name !== 'string' || !PRODUCT_EVENT_NAME_SET.has(name)) {
    throw new InvalidProductEventError('unsupported event field: name');
  }

  const eventName = name as ProductEventName;
  const allowedKeys = allowedKeysFor(eventName);
  const presentKeys = Object.keys(record).filter((key) => record[key] !== undefined);

  for (const key of presentKeys) {
    if (!allowedKeys.has(key)) {
      throw new InvalidProductEventError(`unsupported event field: ${key}`);
    }

    const value = record[key];
    if (value !== null && typeof value === 'object') {
      throw new InvalidProductEventError(`unsupported event field: ${key}`);
    }
  }

  assertRequiredString(record, 'at');
  if (!ISO_8601_DATE_TIME.test(record.at as string)) {
    throw new InvalidProductEventError('invalid event field: at');
  }

  assertRequiredString(record, 'pilotCohort');
  if (!PILOT_COHORTS.has(record.pilotCohort as string)) {
    throw new InvalidProductEventError('invalid event field: pilotCohort');
  }

  assertProtocolPair(record);
  assertTreatmentIdCoherence(record);

  if (eventName === 'app_opened') {
    assertAppOpenedContext(record);
  } else if (PROTOCOL_ASSIGNED_NAMES.has(eventName)) {
    assertRequiredString(record, 'patientId');
    assertRequiredProtocol(record);
    assertOptionalString(record, 'treatmentId');
  } else if (TREATMENT_NAMES.has(eventName)) {
    assertTreatmentContext(record);
  } else if (ENTITY_NAMES.has(eventName)) {
    assertTreatmentContext(record);
    assertRequiredString(record, 'entityId');
  } else if (eventName === 'feedback_submitted') {
    assertTreatmentContext(record);
    assertOptionalFiniteNumber(record, 'usefulnessScore');
    assertOptionalFiniteNumber(record, 'clarityScore');
  }

  const stored: Record<string, unknown> = {};
  for (const key of presentKeys) {
    stored[key] = record[key];
  }

  return Object.freeze(stored) as ProductEvent;
}

function allowedKeysFor(name: ProductEventName): Set<string> {
  if (name === 'app_opened') {
    return APP_OPENED_KEYS;
  }
  if (PROTOCOL_ASSIGNED_NAMES.has(name)) {
    return PROTOCOL_ASSIGNED_KEYS;
  }
  if (TREATMENT_NAMES.has(name)) {
    return TREATMENT_EVENT_KEYS;
  }
  if (ENTITY_NAMES.has(name)) {
    return ENTITY_EVENT_KEYS;
  }
  return FEEDBACK_EVENT_KEYS;
}

function isPresent(record: Record<string, unknown>, key: string): boolean {
  return record[key] !== undefined;
}

function assertRequiredString(record: Record<string, unknown>, key: string): void {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new InvalidProductEventError(
      value === undefined ? `missing event field: ${key}` : `invalid event field: ${key}`,
    );
  }
}

function assertOptionalString(record: Record<string, unknown>, key: string): void {
  if (!isPresent(record, key)) {
    return;
  }
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new InvalidProductEventError(`invalid event field: ${key}`);
  }
}

function assertOptionalFiniteNumber(record: Record<string, unknown>, key: string): void {
  if (!isPresent(record, key)) {
    return;
  }
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidProductEventError(`invalid event field: ${key}`);
  }
}

function assertRequiredProtocol(record: Record<string, unknown>): void {
  assertRequiredString(record, 'protocolKind');
  if (!PROTOCOL_KINDS.has(record.protocolKind as string)) {
    throw new InvalidProductEventError('invalid event field: protocolKind');
  }

  const version = record.protocolVersion;
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    throw new InvalidProductEventError(
      version === undefined
        ? 'missing event field: protocolVersion'
        : 'invalid event field: protocolVersion',
    );
  }
}

function assertTreatmentContext(record: Record<string, unknown>): void {
  assertRequiredString(record, 'patientId');
  assertRequiredString(record, 'treatmentId');
  assertRequiredProtocol(record);
}

function assertProtocolPair(record: Record<string, unknown>): void {
  const hasKind = isPresent(record, 'protocolKind');
  const hasVersion = isPresent(record, 'protocolVersion');
  if (hasKind !== hasVersion) {
    throw new InvalidProductEventError(
      `missing event field: ${hasKind ? 'protocolVersion' : 'protocolKind'}`,
    );
  }

  if (hasKind) {
    const kind = record.protocolKind;
    if (typeof kind !== 'string' || !PROTOCOL_KINDS.has(kind)) {
      throw new InvalidProductEventError('invalid event field: protocolKind');
    }
    const version = record.protocolVersion;
    if (typeof version !== 'number' || !Number.isInteger(version)) {
      throw new InvalidProductEventError('invalid event field: protocolVersion');
    }
  }
}

function assertTreatmentIdCoherence(record: Record<string, unknown>): void {
  if (!isPresent(record, 'treatmentId')) {
    return;
  }

  if (!isPresent(record, 'patientId') || !isPresent(record, 'protocolKind')) {
    throw new InvalidProductEventError('unsupported event field: treatmentId');
  }
}

function assertAppOpenedContext(record: Record<string, unknown>): void {
  const hasPatientId = isPresent(record, 'patientId');
  const hasTreatmentId = isPresent(record, 'treatmentId');
  const hasProtocolKind = isPresent(record, 'protocolKind');
  const hasProtocolVersion = isPresent(record, 'protocolVersion');
  const hasAnyTreatmentField = hasTreatmentId || hasProtocolKind || hasProtocolVersion;

  if (!hasAnyTreatmentField) {
    assertOptionalString(record, 'patientId');
    return;
  }

  if (!hasPatientId || !hasTreatmentId || !hasProtocolKind || !hasProtocolVersion) {
    const incompleteKey = !hasTreatmentId
      ? 'treatmentId'
      : !hasPatientId
        ? 'patientId'
        : !hasProtocolKind
          ? 'protocolKind'
          : 'protocolVersion';
    throw new InvalidProductEventError(`missing event field: ${incompleteKey}`);
  }

  assertRequiredString(record, 'patientId');
  assertRequiredString(record, 'treatmentId');
  assertRequiredProtocol(record);
}
