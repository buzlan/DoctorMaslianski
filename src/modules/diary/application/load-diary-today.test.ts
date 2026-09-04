import {
  createInMemoryProductEventSink,
  DEVELOPMENT_PILOT_COHORT,
} from '@/modules/product-events';
import { calendarDate, createTreatment } from '@/modules/treatment/domain';
import {
  createInMemoryTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { diaryEntryIdFor } from '../domain';
import { createInMemoryDiaryRepository } from '../infrastructure';

import { createCheckinEventSession } from './checkin-events';
import { createDiaryLoader } from './create-diary-loader';
import { loadDiaryToday } from './load-diary-today';

const ON_DATE = calendarDate(2026, 8, 19);
const NEXT_DATE = calendarDate(2026, 8, 20);
const AT = '2026-08-19T15:00:00.000Z';

function activeTreatment() {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    periods: [{ id: 'period-1', startedOn: ON_DATE }],
  });
}

function answers(pain = 3) {
  return { pain, swelling: 4, wellbeing: 'unchanged' as const };
}

function rejectingTreatmentRepository(): TreatmentRepository {
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

describe('loadDiaryToday', () => {
  it('returns open when the active treatment has no entry on that civil date', async () => {
    await expect(
      loadDiaryToday(
        createInMemoryTreatmentRepository({ treatment: activeTreatment() }),
        createInMemoryDiaryRepository(),
        ON_DATE,
      ),
    ).resolves.toEqual({
      status: 'open',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
    });
  });

  it('returns completed after an entry exists for that civil date', async () => {
    const diaryRepository = createInMemoryDiaryRepository();
    const treatment = activeTreatment();
    await diaryRepository.submitEntry(treatment, ON_DATE, answers());

    await expect(
      loadDiaryToday(
        createInMemoryTreatmentRepository({ treatment }),
        diaryRepository,
        ON_DATE,
      ),
    ).resolves.toEqual({
      status: 'completed',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
    });
  });

  it('returns open again on the next civil date', async () => {
    const diaryRepository = createInMemoryDiaryRepository();
    const treatment = activeTreatment();
    await diaryRepository.submitEntry(treatment, ON_DATE, answers());

    await expect(
      loadDiaryToday(
        createInMemoryTreatmentRepository({ treatment }),
        diaryRepository,
        NEXT_DATE,
      ),
    ).resolves.toMatchObject({ status: 'open' });
  });

  it('returns no_active_treatment when treatment is missing or not active', async () => {
    await expect(
      loadDiaryToday(
        createInMemoryTreatmentRepository({ empty: true }),
        createInMemoryDiaryRepository(),
        ON_DATE,
      ),
    ).resolves.toEqual({ status: 'no_active_treatment' });

    await expect(
      loadDiaryToday(
        createInMemoryTreatmentRepository({
          treatment: createTreatment({
            id: 'treatment-1',
            patientId: 'patient-1',
            status: 'completed',
          }),
        }),
        createInMemoryDiaryRepository(),
        ON_DATE,
      ),
    ).resolves.toEqual({ status: 'no_active_treatment' });
  });

  it('returns error when the treatment repository rejects', async () => {
    await expect(
      loadDiaryToday(
        rejectingTreatmentRepository(),
        createInMemoryDiaryRepository(),
        ON_DATE,
      ),
    ).resolves.toEqual({ status: 'error' });
  });
});

describe('createDiaryLoader', () => {
  const now = () => new Date(AT);

  it('emits one checkin_requested when today is open and not on completed-today', async () => {
    const sink = createInMemoryProductEventSink();
    const checkinEvents = createCheckinEventSession({ eventSink: sink, now });
    const loader = createDiaryLoader({
      treatmentRepository: createInMemoryTreatmentRepository({
        treatment: activeTreatment(),
      }),
      diaryRepository: createInMemoryDiaryRepository(),
      checkinEvents,
    });

    await expect(loader.load(ON_DATE)).resolves.toMatchObject({ status: 'open' });
    await expect(loader.load(ON_DATE)).resolves.toMatchObject({ status: 'open' });

    expect(sink.getAll()).toEqual([
      {
        name: 'checkin_requested',
        at: AT,
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
        patientId: 'patient-1',
        treatmentId: 'treatment-1',
        entityId: diaryEntryIdFor('treatment-1', ON_DATE),
      },
    ]);
  });

  it('does not emit checkin_requested when today is already submitted', async () => {
    const sink = createInMemoryProductEventSink();
    const diaryRepository = createInMemoryDiaryRepository();
    const treatment = activeTreatment();
    await diaryRepository.submitEntry(treatment, ON_DATE, answers());
    const loader = createDiaryLoader({
      treatmentRepository: createInMemoryTreatmentRepository({ treatment }),
      diaryRepository,
      checkinEvents: createCheckinEventSession({ eventSink: sink, now }),
    });

    await expect(loader.load(ON_DATE)).resolves.toMatchObject({ status: 'completed' });
    expect(sink.getAll()).toEqual([]);
  });

  it('submits once, emits checkin_submitted without clinical fields, and ignores a second submit', async () => {
    const sink = createInMemoryProductEventSink();
    const checkinEvents = createCheckinEventSession({ eventSink: sink, now });
    const loader = createDiaryLoader({
      treatmentRepository: createInMemoryTreatmentRepository({
        treatment: activeTreatment(),
      }),
      diaryRepository: createInMemoryDiaryRepository(),
      checkinEvents,
    });

    await loader.load(ON_DATE);
    const first = await loader.submit(ON_DATE, answers(2));
    const second = await loader.submit(ON_DATE, { pain: 9, swelling: 9, wellbeing: 'worse' });

    expect(first).toEqual({
      status: 'completed',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
    });
    expect(second).toEqual(first);
    expect(sink.getAll().map((event) => event.name)).toEqual([
      'checkin_requested',
      'checkin_submitted',
    ]);
    const submitted = sink.getAll()[1];
    expect(submitted).toEqual({
      name: 'checkin_submitted',
      at: AT,
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      entityId: diaryEntryIdFor('treatment-1', ON_DATE),
    });
    expect(submitted).not.toHaveProperty('pain');
    expect(submitted).not.toHaveProperty('swelling');
    expect(submitted).not.toHaveProperty('wellbeing');
    expect(submitted).not.toHaveProperty('answers');
    expect(submitted).not.toHaveProperty('protocolKind');
    expect(submitted).not.toHaveProperty('protocolVersion');
  });

  it('shares checkin_requested across Today and Diary loaders in the same session', async () => {
    const sink = createInMemoryProductEventSink();
    const checkinEvents = createCheckinEventSession({ eventSink: sink, now });
    const treatmentRepository = createInMemoryTreatmentRepository({
      treatment: activeTreatment(),
    });
    const diaryRepository = createInMemoryDiaryRepository();
    const diaryLoader = createDiaryLoader({
      treatmentRepository,
      diaryRepository,
      checkinEvents,
    });

    await checkinEvents.emitRequestedIfNeeded({
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      onDate: ON_DATE,
    });
    await diaryLoader.load(ON_DATE);

    expect(sink.getAll()).toHaveLength(1);
    expect(sink.getAll()[0]?.name).toBe('checkin_requested');
  });
});
