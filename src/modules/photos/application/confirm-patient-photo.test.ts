import { calendarDate, createTreatment } from '@/modules/treatment/domain';
import {
  createInMemoryProductEventSink,
  DEVELOPMENT_PILOT_COHORT,
} from '@/modules/product-events';
import { createInMemoryTreatmentRepository } from '@/modules/treatment/infrastructure';

import { confirmPatientPhoto } from './confirm-patient-photo';
import {
  createInMemoryPatientPhotoFileOps,
  createInMemoryPatientPhotoStore,
  createPersistentPatientPhotoRepository,
} from '../infrastructure';

const ON_DATE = calendarDate(2026, 8, 19);
const AT = '2026-08-19T15:00:00.000Z';

function activeTreatment() {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    periods: [{ id: 'period-1', startedOn: ON_DATE }],
  });
}

describe('confirmPatientPhoto', () => {
  it('emits patient_photo_added with identifiers only after persist', async () => {
    const eventSink = createInMemoryProductEventSink();
    const result = await confirmPatientPhoto(
      {
        treatmentRepository: createInMemoryTreatmentRepository({ treatment: activeTreatment() }),
        photoRepository: createPersistentPatientPhotoRepository({
          store: createInMemoryPatientPhotoStore(),
          fileOps: createInMemoryPatientPhotoFileOps(),
        }),
        eventSink,
        now: () => new Date(AT),
      },
      ON_DATE,
      { sourceUri: 'file:///cache/a.png', fileName: 'a.png' },
    );

    expect(result.status).toBe('recorded');
    expect(eventSink.getAll()).toEqual([
      {
        name: 'patient_photo_added',
        at: AT,
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
        patientId: 'patient-1',
        treatmentId: 'treatment-1',
        entityId: 'treatment-1:2026-8-19:1',
      },
    ]);
    expect(eventSink.getAll()[0]).not.toHaveProperty('localFileRef');
    expect(eventSink.getAll()[0]).not.toHaveProperty('uri');
    expect(eventSink.getAll()[0]).not.toHaveProperty('mimeType');
  });

  it('does not emit an event when the daily cap is reached', async () => {
    const eventSink = createInMemoryProductEventSink();
    const photoRepository = createPersistentPatientPhotoRepository({
      store: createInMemoryPatientPhotoStore(),
      fileOps: createInMemoryPatientPhotoFileOps(),
    });
    const deps = {
      treatmentRepository: createInMemoryTreatmentRepository({ treatment: activeTreatment() }),
      photoRepository,
      eventSink,
      now: () => new Date(AT),
    };
    const captured = { sourceUri: 'file:///cache/a.jpg', fileName: 'a.jpg' };

    await confirmPatientPhoto(deps, ON_DATE, captured);
    await confirmPatientPhoto(deps, ON_DATE, captured);
    await confirmPatientPhoto(deps, ON_DATE, captured);
    const fourth = await confirmPatientPhoto(deps, ON_DATE, captured);

    expect(fourth).toEqual({ status: 'ignored', reason: 'daily_cap_reached' });
    expect(eventSink.getAll()).toHaveLength(3);
    expect(eventSink.getAll().every((event) => event.name === 'patient_photo_added')).toBe(true);
  });
});
