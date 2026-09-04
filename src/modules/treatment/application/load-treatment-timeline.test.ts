import { calendarDate, createTreatment } from '@/modules/treatment/domain';
import {
  createInMemoryTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { loadTreatmentTimeline } from './load-treatment-timeline';

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

describe('loadTreatmentTimeline', () => {
  it('returns ready when the repository resolves an active treatment', async () => {
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

    await expect(loadTreatmentTimeline(repository, ON_DATE)).resolves.toEqual({
      status: 'ready',
      timeline: {
        kind: 'ready',
        patientId: 'dev-patient-1',
        treatmentId: 'treatment-1',
        periodDayNumber: 1,
        currentPeriodId: 'current',
        periods: [
          {
            id: 'current',
            isCurrent: true,
            startedOn: ON_DATE,
            milestones: [{ id: 'visit-1', title: 'synthetic-visit', occurredOn: ON_DATE }],
          },
        ],
        ungroupedMilestones: [],
        currentAppointment: null,
      },
    });
  });

  it('returns no_active_treatment when the repository resolves null', async () => {
    const repository = createInMemoryTreatmentRepository({ empty: true });

    await expect(loadTreatmentTimeline(repository, ON_DATE)).resolves.toEqual({
      status: 'no_active_treatment',
    });
  });

  it('returns error when the repository rejects', async () => {
    await expect(loadTreatmentTimeline(rejectingRepository(), ON_DATE)).resolves.toEqual({
      status: 'error',
    });
  });
});
