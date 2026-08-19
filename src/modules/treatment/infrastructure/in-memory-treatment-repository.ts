/**
 * In-memory TreatmentRepository for development.
 *
 * Stores an already-assigned Treatment from assignTreatment().
 * getActiveTreatment() does not look up or reconstruct from a live protocol catalog.
 */

import { assignTreatment } from '../domain';
import type { CalendarDate, Patient, PilotProtocol, Treatment } from '../domain';

import {
  DEVELOPMENT_TREATMENT_ID,
  DEVELOPMENT_TREATMENT_START_DATE,
  developmentPatient,
} from './fixtures/pilot-patient';
import { sclerotherapyV1 } from './fixtures/pilot-protocols';
import type { TreatmentRepository } from './treatment-repository';

export type InMemoryTreatmentRepositorySeed =
  | { empty: true }
  | {
      empty?: false;
      patient?: Patient;
      protocol?: PilotProtocol;
      treatmentId?: string;
      startDate?: CalendarDate;
    };

class InMemoryTreatmentRepository implements TreatmentRepository {
  constructor(private readonly treatment: Treatment | null) {}

  getActiveTreatment(): Promise<Treatment | null> {
    return Promise.resolve(this.treatment);
  }
}

function createDevelopmentTreatment(
  seed: Extract<InMemoryTreatmentRepositorySeed, { empty?: false }>,
): Treatment {
  const patient = seed.patient ?? developmentPatient;
  const protocol = seed.protocol ?? sclerotherapyV1;

  return assignTreatment({
    id: seed.treatmentId ?? DEVELOPMENT_TREATMENT_ID,
    patientId: patient.id,
    protocol,
    startDate: seed.startDate ?? DEVELOPMENT_TREATMENT_START_DATE,
    status: 'active',
  });
}

export function createInMemoryTreatmentRepository(
  seed: InMemoryTreatmentRepositorySeed = {},
): TreatmentRepository {
  if (seed.empty === true) {
    return new InMemoryTreatmentRepository(null);
  }

  return new InMemoryTreatmentRepository(createDevelopmentTreatment(seed));
}

export const sharedTreatmentRepository = createInMemoryTreatmentRepository();
