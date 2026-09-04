/**
 * Development structural fixture for TASK-041.
 *
 * This is not clinic-authored treatment content. Assignments stay empty
 * because approved catalog text is not available. Do not copy intake
 * markers such as "TBD by clinic" into patient-facing fields.
 */

import { createTreatment } from '../../domain';
import type { Treatment } from '../../domain';

import {
  DEVELOPMENT_PERIOD_ID,
  DEVELOPMENT_TREATMENT_ID,
  DEVELOPMENT_TREATMENT_START_DATE,
  developmentPatient,
} from './pilot-patient';

export function createDevelopmentTreatment(): Treatment {
  return createTreatment({
    id: DEVELOPMENT_TREATMENT_ID,
    patientId: developmentPatient.id,
    periods: [
      {
        id: DEVELOPMENT_PERIOD_ID,
        startedOn: DEVELOPMENT_TREATMENT_START_DATE,
      },
    ],
  });
}
