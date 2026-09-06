import { createDoctorMilestonePhoto } from '@/modules/photos/domain';
import { createInMemoryDoctorMilestonePhotoRepository } from '@/modules/photos/infrastructure';
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

  it('attaches doctor photo counts without resolving signed URLs', async () => {
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
    const photoRepository = createInMemoryDoctorMilestonePhotoRepository({
      photos: [
        createDoctorMilestonePhoto({
          id: 'photo-1',
          treatmentId: 'treatment-1',
          milestoneId: 'visit-1',
          storageRef: 'doctor/visit-1/a.jpg',
        }),
        createDoctorMilestonePhoto({
          id: 'photo-2',
          treatmentId: 'treatment-1',
          milestoneId: 'visit-1',
          storageRef: 'doctor/visit-1/b.jpg',
        }),
      ],
    });

    const result = await loadTreatmentTimeline(repository, ON_DATE, photoRepository);

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') {
      return;
    }
    expect(result.timeline.periods[0]?.milestones[0]?.doctorPhotoCount).toBe(2);
  });

  it('keeps the timeline when photo listing fails', async () => {
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
    const photoRepository = {
      listPhotos() {
        return Promise.reject(new Error('photos unavailable'));
      },
      resolveDisplayUri() {
        throw new Error('should not resolve signed URLs on the timeline');
      },
    };

    await expect(
      loadTreatmentTimeline(repository, ON_DATE, photoRepository),
    ).resolves.toMatchObject({
      status: 'ready',
      timeline: {
        periods: [
          {
            milestones: [{ id: 'visit-1', title: 'synthetic-visit', occurredOn: ON_DATE }],
          },
        ],
      },
    });
  });
});

