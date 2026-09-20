import { createCheckinEventSession } from '@/modules/diary/application';
import { createInMemoryDiaryRepository } from '@/modules/diary/infrastructure';
import { createInMemoryPatientPhotoRepository } from '@/modules/photos/infrastructure';
import {
  createInMemoryProductEventSink,
  DEVELOPMENT_PILOT_COHORT,
} from '@/modules/product-events';
import { calendarDate, createTreatment } from '@/modules/treatment/domain';
import {
  createInMemoryTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { createTodayLoader, loadTodayOverview } from './load-today-overview';

const ON_DATE = calendarDate(2026, 8, 1);
const AT = '2026-08-19T15:00:00.000Z';

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

describe('loadTodayOverview', () => {
  it('returns ready when the repository resolves an active treatment', async () => {
    const repository = createInMemoryTreatmentRepository({
      treatment: createTreatment({
        id: 'treatment-1',
        patientId: 'dev-patient-1',
        periods: [{ id: 'current', startedOn: ON_DATE }],
        assignments: [
          {
            id: 'on-start',
            catalogItemId: 'catalog-1',
            title: 'synthetic-start',
            startDate: ON_DATE,
            endDate: ON_DATE,
            status: 'active',
          },
        ],
      }),
    });

    await expect(
      loadTodayOverview(
        repository,
        createInMemoryDiaryRepository(),
        createInMemoryPatientPhotoRepository(),
        ON_DATE,
      ),
    ).resolves.toEqual({
      status: 'ready',
      overview: {
        kind: 'ready',
        patientId: 'dev-patient-1',
        treatmentId: 'treatment-1',
        periodDayNumber: 1,
        assignments: [{ id: 'on-start', title: 'synthetic-start', completed: false }],
        diaryOpen: true,
        photosRecordedToday: 0,
        photoAddOpen: true,
        currentAppointment: null,
      },
    });
  });

  it('returns no_active_treatment when the repository resolves null', async () => {
    await expect(
      loadTodayOverview(
        createInMemoryTreatmentRepository({ empty: true }),
        createInMemoryDiaryRepository(),
        createInMemoryPatientPhotoRepository(),
        ON_DATE,
      ),
    ).resolves.toEqual({
      status: 'no_active_treatment',
    });
  });

  it('returns error when the repository rejects', async () => {
    await expect(
      loadTodayOverview(
        rejectingRepository(),
        createInMemoryDiaryRepository(),
        createInMemoryPatientPhotoRepository(),
        ON_DATE,
      ),
    ).resolves.toEqual({
      status: 'error',
    });
  });
});

function createLoaderDeps(
  sink: ReturnType<typeof createInMemoryProductEventSink>,
  repository: TreatmentRepository,
  now: () => Date,
  diaryRepository = createInMemoryDiaryRepository(),
) {
  return {
    repository,
    diaryRepository,
    photoRepository: createInMemoryPatientPhotoRepository(),
    eventSink: sink,
    checkinEvents: createCheckinEventSession({ eventSink: sink, now }),
    now,
  };
}

describe('createTodayLoader', () => {
  const now = () => new Date(AT);

  it('emits one contextual app_opened for an active treatment', async () => {
    const sink = createInMemoryProductEventSink();
    const loader = createTodayLoader(
      createLoaderDeps(
        sink,
        createInMemoryTreatmentRepository({
          treatment: createTreatment({
            id: 'treatment-1',
            patientId: 'dev-patient-1',
            periods: [{ id: 'current', startedOn: ON_DATE }],
          }),
        }),
        now,
      ),
    );

    await expect(loader.load(ON_DATE)).resolves.toMatchObject({
      status: 'ready',
      overview: { diaryOpen: true },
    });
    expect(sink.getAll().map((event) => event.name)).toEqual([
      'app_opened',
      'checkin_requested',
    ]);
    expect(sink.getAll().some((event) => event.name === 'patient_photo_added')).toBe(false);
    expect(sink.getAll().some((event) => event.name.startsWith('photo_checkpoint'))).toBe(false);
    expect(sink.getAll()[0]).toEqual({
      name: 'app_opened',
      at: AT,
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
      patientId: 'dev-patient-1',
      treatmentId: 'treatment-1',
    });
  });

  it('emits one base app_opened when there is no active treatment', async () => {
    const sink = createInMemoryProductEventSink();
    const loader = createTodayLoader(
      createLoaderDeps(sink, createInMemoryTreatmentRepository({ empty: true }), now),
    );

    await expect(loader.load(ON_DATE)).resolves.toEqual({ status: 'no_active_treatment' });
    expect(sink.getAll()).toEqual([
      {
        name: 'app_opened',
        at: AT,
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
      },
    ]);
  });

  it('emits one base app_opened when the first load rejects', async () => {
    const sink = createInMemoryProductEventSink();
    const loader = createTodayLoader(createLoaderDeps(sink, rejectingRepository(), now));

    await expect(loader.load(ON_DATE)).resolves.toEqual({ status: 'error' });
    expect(sink.getAll()).toEqual([
      {
        name: 'app_opened',
        at: AT,
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
      },
    ]);
  });

  it('does not emit a second app_opened on retry, including after an error', async () => {
    const sink = createInMemoryProductEventSink();
    const emptyRepository = createInMemoryTreatmentRepository({ empty: true });
    let shouldReject = true;
    const repository: TreatmentRepository = {
      getActiveTreatment() {
        if (shouldReject) {
          return Promise.reject(new Error('repository unavailable'));
        }
        return emptyRepository.getActiveTreatment();
      },
      ...ignoredWrites(),
    };
    const loader = createTodayLoader(createLoaderDeps(sink, repository, now));

    await expect(loader.load(ON_DATE)).resolves.toEqual({ status: 'error' });
    shouldReject = false;
    await expect(loader.load(ON_DATE)).resolves.toEqual({ status: 'no_active_treatment' });

    expect(sink.getAll()).toHaveLength(1);
    expect(sink.getAll()[0]).toEqual({
      name: 'app_opened',
      at: AT,
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
    });
  });

  it('does not include protocol snapshot fields or clinical text on app_opened', async () => {
    const sink = createInMemoryProductEventSink();
    const loader = createTodayLoader(
      createLoaderDeps(
        sink,
        createInMemoryTreatmentRepository({
          treatment: createTreatment({
            id: 'treatment-1',
            patientId: 'dev-patient-1',
            periods: [{ id: 'current', startedOn: ON_DATE }],
            assignments: [
              {
                id: 'on-start',
                catalogItemId: 'catalog-1',
                title: 'synthetic-task-title',
                instruction: 'synthetic-task-instruction',
                startDate: ON_DATE,
                endDate: ON_DATE,
                status: 'active',
              },
            ],
          }),
        }),
        now,
      ),
    );

    await loader.load(ON_DATE);

    const event = sink.getAll()[0];
    expect(event).toEqual({
      name: 'app_opened',
      at: AT,
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
      patientId: 'dev-patient-1',
      treatmentId: 'treatment-1',
    });
    expect(event).not.toHaveProperty('protocolKind');
    expect(event).not.toHaveProperty('protocolVersion');
    expect(event).not.toHaveProperty('title');
    expect(event).not.toHaveProperty('instruction');
    expect(event).not.toHaveProperty('answers');
    expect(event).not.toHaveProperty('photoUrl');
    expect(JSON.stringify(event)).not.toContain('synthetic-task');
  });

  it('does not emit a second app_opened when completing an assignment after load', async () => {
    const sink = createInMemoryProductEventSink();
    const loader = createTodayLoader(
      createLoaderDeps(
        sink,
        createInMemoryTreatmentRepository({
          treatment: createTreatment({
            id: 'treatment-1',
            patientId: 'dev-patient-1',
            periods: [{ id: 'current', startedOn: ON_DATE }],
            assignments: [
              {
                id: 'assignment-1',
                catalogItemId: 'catalog-1',
                startDate: ON_DATE,
                endDate: ON_DATE,
                status: 'active',
              },
            ],
          }),
        }),
        now,
      ),
    );

    await loader.load(ON_DATE);
    const result = await loader.completeAssignment('assignment-1', ON_DATE);

    expect(result).toMatchObject({
      status: 'ready',
      overview: {
        assignments: [{ id: 'assignment-1', completed: true }],
        diaryOpen: true,
      },
    });
    expect(sink.getAll().map((event) => event.name)).toEqual([
      'app_opened',
      'checkin_requested',
      'task_completed',
    ]);
  });

  it('sets diaryOpen false when today’s diary is already submitted', async () => {
    const sink = createInMemoryProductEventSink();
    const diaryRepository = createInMemoryDiaryRepository();
    const treatment = createTreatment({
      id: 'treatment-1',
      patientId: 'dev-patient-1',
      periods: [{ id: 'current', startedOn: ON_DATE }],
    });
    await diaryRepository.submitEntry(treatment, ON_DATE, {
      pain: 1,
      swelling: 2,
      wellbeing: 'better',
    });
    const loader = createTodayLoader(
      createLoaderDeps(
        sink,
        createInMemoryTreatmentRepository({ treatment }),
        now,
        diaryRepository,
      ),
    );

    const result = await loader.load(ON_DATE);
    expect(result).toMatchObject({
      status: 'ready',
      overview: { diaryOpen: false },
    });
    expect(JSON.stringify(result)).not.toContain('pain');
    expect(JSON.stringify(result)).not.toContain('better');
    expect(sink.getAll().map((event) => event.name)).toEqual(['app_opened']);
  });
});
