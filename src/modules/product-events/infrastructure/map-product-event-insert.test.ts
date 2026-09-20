import type { RemotePatientContext } from '@/core/auth/remote-patient-context';
import { DEVELOPMENT_PILOT_COHORT, type ProductEvent } from '../domain';

import { mapProductEventInsert } from './map-product-event-insert';

const context: RemotePatientContext = {
  authUserId: 'auth-1',
  patientId: 'patient-1',
  clinicId: 'clinic-1',
  clinicTimeZone: 'Europe/Minsk',
  contact: {},
  pilotCohort: 'closed_beta',
};

describe('mapProductEventInsert', () => {
  it('uses RemotePatientContext cohort rather than the event cohort', () => {
    const event: ProductEvent = {
      name: 'task_completed',
      at: '2026-09-04T10:00:00.000Z',
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
      patientId: 'ignored-patient',
      treatmentId: 'treatment-1',
      entityId: 'a1:2026-9-4',
    };

    const mapped = mapProductEventInsert(event, context);
    expect(mapped).toEqual({
      status: 'ready',
      row: {
        name: 'task_completed',
        occurred_at: '2026-09-04T10:00:00.000Z',
        pilot_cohort: 'closed_beta',
        patient_id: 'patient-1',
        treatment_id: 'treatment-1',
        entity_id: 'a1:2026-9-4',
      },
    });
    expect(mapped.status === 'ready' && 'protocol_kind' in mapped.row).toBe(false);
    expect(mapped.status === 'ready' && 'protocol_version' in mapped.row).toBe(false);
    expect(mapped.status === 'ready' && 'clinic_id' in mapped.row).toBe(false);
  });

  it('does not insert when the authenticated patient has no cohort', () => {
    const event: ProductEvent = {
      name: 'app_opened',
      at: '2026-09-04T10:00:00.000Z',
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
      patientId: 'patient-1',
    };

    expect(
      mapProductEventInsert(event, { ...context, pilotCohort: null }),
    ).toEqual({ status: 'skip_no_cohort' });
  });
});
