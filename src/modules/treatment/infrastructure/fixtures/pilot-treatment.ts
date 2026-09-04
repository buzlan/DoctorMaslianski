/**
 * Development structural fixture.
 *
 * This is not clinic-authored treatment content. Assignments stay empty
 * because approved catalog text is not available. Do not copy intake
 * markers such as "TBD by clinic" into patient-facing fields.
 *
 * Default status is **active**. Pass `{ status: 'completed' }` only to
 * verify the TASK-028 completion shell. That is not a patient-facing control.
 */

import type { Treatment, TreatmentStatus } from "../../domain";
import { createTreatment } from "../../domain";

import {
  DEVELOPMENT_PERIOD_ID,
  DEVELOPMENT_TREATMENT_ID,
  DEVELOPMENT_TREATMENT_START_DATE,
  developmentPatient,
} from "./pilot-patient";

/**
 * Default development treatment is **active**.
 *
 * Set to `'completed'` only to verify the TASK-028 completion shell.
 * Restore `'active'` afterward. This is not a patient-facing control.
 */
export const DEVELOPMENT_TREATMENT_STATUS: TreatmentStatus = "active";

export function createDevelopmentTreatment(
  options: { status?: TreatmentStatus } = {},
): Treatment {
  return createTreatment({
    id: DEVELOPMENT_TREATMENT_ID,
    patientId: developmentPatient.id,
    status: options.status ?? DEVELOPMENT_TREATMENT_STATUS,
    periods: [
      {
        id: DEVELOPMENT_PERIOD_ID,
        startedOn: DEVELOPMENT_TREATMENT_START_DATE,
      },
    ],
  });
}
