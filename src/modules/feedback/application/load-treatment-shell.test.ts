import { createTreatment } from '@/modules/treatment/domain';
import {
  createInMemoryTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { loadTreatmentShell } from './load-treatment-shell';

function rejectingRepository(): TreatmentRepository {
  return {
    getActiveTreatment() {
      return Promise.reject(new Error('repository unavailable'));
    },
    completeAssignment() {
      return Promise.resolve({ status: 'ignored', reason: 'no_active_treatment' });
    },
    uncompleteAssignment() {
      return Promise.resolve({ status: 'ignored', reason: 'no_active_treatment' });
    },
  };
}

describe('loadTreatmentShell', () => {
  it('returns completed only when treatment status is completed', async () => {
    await expect(
      loadTreatmentShell(
        createInMemoryTreatmentRepository({
          treatment: createTreatment({
            id: 'treatment-1',
            patientId: 'patient-1',
            status: 'completed',
          }),
        }),
      ),
    ).resolves.toEqual({
      status: 'completed',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
    });
  });

  it('keeps tabs for an active treatment', async () => {
    await expect(
      loadTreatmentShell(
        createInMemoryTreatmentRepository({
          treatment: createTreatment({
            id: 'treatment-1',
            patientId: 'patient-1',
          }),
        }),
      ),
    ).resolves.toEqual({ status: 'tabs' });
  });

  it('keeps tabs for a cancelled treatment', async () => {
    await expect(
      loadTreatmentShell(
        createInMemoryTreatmentRepository({
          treatment: createTreatment({
            id: 'treatment-1',
            patientId: 'patient-1',
            status: 'cancelled',
          }),
        }),
      ),
    ).resolves.toEqual({ status: 'tabs' });
  });

  it('keeps tabs when there is no treatment or the repository fails', async () => {
    await expect(
      loadTreatmentShell(createInMemoryTreatmentRepository({ empty: true })),
    ).resolves.toEqual({ status: 'tabs' });
    await expect(loadTreatmentShell(rejectingRepository())).resolves.toEqual({
      status: 'tabs',
    });
  });
});
