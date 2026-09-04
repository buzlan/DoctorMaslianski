import { calendarDate, createTreatment } from '@/modules/treatment/domain';
import {
  createInMemoryTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { loadMilestoneDetail } from './load-milestone-detail';

const ON_DATE = calendarDate(2026, 8, 1);

function ignoredWrites(): Pick<TreatmentRepository, 'completeAssignment' | 'uncompleteAssignment'> {
  return {
    completeAssignment() {
      return Promise.resolve({ status: 'ignored', reason: 'no_active_treatment' });
    },
    uncompleteAssignment() {
      return Promise.resolve({ status: 'ignored', reason: 'no_active_treatment' });
    },
  };
}

function rejectingRepository(): TreatmentRepository {
  return {
    getActiveTreatment() {
      return Promise.reject(new Error('repository unavailable'));
    },
    ...ignoredWrites(),
  };
}

describe('loadMilestoneDetail', () => {
  it('returns ready when the repository has a matching synthetic milestone', async () => {
    const repository = createInMemoryTreatmentRepository({
      treatment: createTreatment({
        id: 'treatment-1',
        patientId: 'dev-patient-1',
        periods: [{ id: 'current', startedOn: ON_DATE }],
        milestones: [
          {
            id: 'visit-1',
            title: 'synthetic-visit',
            occurredOn: ON_DATE,
          },
        ],
      }),
    });

    await expect(loadMilestoneDetail(repository, 'visit-1')).resolves.toEqual({
      status: 'ready',
      detail: {
        kind: 'ready',
        patientId: 'dev-patient-1',
        treatmentId: 'treatment-1',
        milestone: {
          id: 'visit-1',
          title: 'synthetic-visit',
          occurredOn: ON_DATE,
        },
      },
    });
  });

  it('returns not_found when the repository is empty, the id is blank, or the id is unknown', async () => {
    const empty = createInMemoryTreatmentRepository({ empty: true });
    const seeded = createInMemoryTreatmentRepository({
      treatment: createTreatment({
        id: 'treatment-1',
        patientId: 'dev-patient-1',
        periods: [{ id: 'current', startedOn: ON_DATE }],
        milestones: [{ id: 'visit-1', title: 'synthetic-visit' }],
      }),
    });

    await expect(loadMilestoneDetail(empty, 'visit-1')).resolves.toEqual({
      status: 'not_found',
    });
    await expect(loadMilestoneDetail(seeded, '')).resolves.toEqual({
      status: 'not_found',
    });
    await expect(loadMilestoneDetail(seeded, 'missing-id')).resolves.toEqual({
      status: 'not_found',
    });
  });

  it('returns error when the repository rejects', async () => {
    await expect(loadMilestoneDetail(rejectingRepository(), 'visit-1')).resolves.toEqual({
      status: 'error',
    });
  });
});
