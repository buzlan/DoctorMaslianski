import { createDoctorMilestonePhoto } from '@/modules/photos/domain';
import {
  createInMemoryDoctorMilestonePhotoRepository,
  type DoctorMilestonePhotoRepository,
} from '@/modules/photos/infrastructure';
import { calendarDate, createTreatment } from '@/modules/treatment/domain';
import {
  createInMemoryTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { loadMilestoneDetail } from './load-milestone-detail';

const ON_DATE = calendarDate(2026, 8, 1);

const visitPhoto = createDoctorMilestonePhoto({
  id: 'photo-1',
  treatmentId: 'treatment-1',
  milestoneId: 'visit-1',
  storageRef: 'visit-1-photo-1.jpg',
});

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

function rejectingPhotoRepository(): DoctorMilestonePhotoRepository {
  return {
    listPhotos() {
      return Promise.reject(new Error('photos unavailable'));
    },
    resolveDisplayUri() {
      return Promise.reject(new Error('photos unavailable'));
    },
  };
}

function seededTreatment() {
  return createInMemoryTreatmentRepository({
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
}

describe('loadMilestoneDetail', () => {
  it('returns ready when the repository has a matching synthetic milestone', async () => {
    await expect(
      loadMilestoneDetail(
        seededTreatment(),
        createInMemoryDoctorMilestonePhotoRepository(),
        'visit-1',
      ),
    ).resolves.toEqual({
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
        doctorPhotos: { status: 'ready', items: [] },
      },
    });
  });

  it('projects doctor photos for the matching visit only', async () => {
    const photoRepository = createInMemoryDoctorMilestonePhotoRepository({
      photos: [
        visitPhoto,
        createDoctorMilestonePhoto({
          id: 'photo-2',
          treatmentId: 'treatment-1',
          milestoneId: 'visit-2',
          storageRef: 'visit-2-photo-1.jpg',
        }),
      ],
      displayUris: {
        'photo-1': 'https://example.test/doctor-1.jpg',
        'photo-2': 'https://example.test/doctor-2.jpg',
      },
    });

    await expect(
      loadMilestoneDetail(seededTreatment(), photoRepository, 'visit-1'),
    ).resolves.toEqual({
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
        doctorPhotos: {
          status: 'ready',
          items: [{ id: 'photo-1', displayUri: 'https://example.test/doctor-1.jpg' }],
        },
      },
    });
  });

  it('skips a photo whose display URI cannot be resolved', async () => {
    const photoRepository = createInMemoryDoctorMilestonePhotoRepository({
      photos: [
        visitPhoto,
        createDoctorMilestonePhoto({
          id: 'photo-2',
          treatmentId: 'treatment-1',
          milestoneId: 'visit-1',
          storageRef: 'visit-1-photo-2.jpg',
        }),
      ],
      displayUris: { 'photo-2': 'https://example.test/doctor-2.jpg' },
    });

    await expect(
      loadMilestoneDetail(seededTreatment(), photoRepository, 'visit-1'),
    ).resolves.toMatchObject({
      status: 'ready',
      detail: {
        doctorPhotos: {
          status: 'ready',
          items: [{ id: 'photo-2', displayUri: 'https://example.test/doctor-2.jpg' }],
        },
      },
    });
  });

  it('skips a photo whose display URI resolution throws and keeps the visit ready', async () => {
    const photoRepository: DoctorMilestonePhotoRepository = {
      listPhotos() {
        return Promise.resolve([
          visitPhoto,
          createDoctorMilestonePhoto({
            id: 'photo-2',
            treatmentId: 'treatment-1',
            milestoneId: 'visit-1',
            storageRef: 'visit-1-photo-2.jpg',
          }),
        ]);
      },
      resolveDisplayUri(photo) {
        if (photo.id === 'photo-1') {
          return Promise.reject(new Error('signed url failed'));
        }

        return Promise.resolve('https://example.test/doctor-2.jpg');
      },
    };

    await expect(
      loadMilestoneDetail(seededTreatment(), photoRepository, 'visit-1'),
    ).resolves.toMatchObject({
      status: 'ready',
      detail: {
        milestone: { id: 'visit-1', title: 'synthetic-visit' },
        doctorPhotos: {
          status: 'ready',
          items: [{ id: 'photo-2', displayUri: 'https://example.test/doctor-2.jpg' }],
        },
      },
    });
  });

  it('keeps the visit ready when doctor photos fail to load', async () => {
    await expect(
      loadMilestoneDetail(seededTreatment(), rejectingPhotoRepository(), 'visit-1'),
    ).resolves.toEqual({
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
        doctorPhotos: { status: 'unavailable' },
      },
    });
  });

  it('returns not_found when the repository is empty, the id is blank, or the id is unknown', async () => {
    const empty = createInMemoryTreatmentRepository({ empty: true });
    const seeded = seededTreatment();
    const photos = createInMemoryDoctorMilestonePhotoRepository();

    await expect(loadMilestoneDetail(empty, photos, 'visit-1')).resolves.toEqual({
      status: 'not_found',
    });
    await expect(loadMilestoneDetail(seeded, photos, '')).resolves.toEqual({
      status: 'not_found',
    });
    await expect(loadMilestoneDetail(seeded, photos, 'missing-id')).resolves.toEqual({
      status: 'not_found',
    });
  });

  it('returns error when the treatment repository rejects', async () => {
    await expect(
      loadMilestoneDetail(
        rejectingRepository(),
        createInMemoryDoctorMilestonePhotoRepository(),
        'visit-1',
      ),
    ).resolves.toEqual({
      status: 'error',
    });
  });
});
