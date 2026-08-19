import {
  createInMemoryProductEventSink,
  DEVELOPMENT_PILOT_COHORT,
} from '@/modules/product-events';
import { calendarDate, type PilotProtocol } from '@/modules/treatment/domain';
import {
  createInMemoryTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { createTodayLoader, loadTodayOverview } from './load-today-overview';

const ON_DATE = calendarDate(2026, 8, 1);
const AT = '2026-08-19T15:00:00.000Z';

function createProtocol(overrides: Partial<PilotProtocol> = {}): PilotProtocol {
  return {
    id: 'protocol-sclerotherapy',
    kind: 'sclerotherapy',
    version: 1,
    stages: [],
    tasks: [],
    checkInDefinitions: [],
    photoCheckpoints: [],
    restrictions: [],
    appointmentPattern: [],
    ...overrides,
  };
}

function rejectingRepository(): TreatmentRepository {
  return {
    getActiveTreatment() {
      return Promise.reject(new Error('repository unavailable'));
    },
  };
}

describe('loadTodayOverview', () => {
  it('returns ready when the repository resolves an active treatment', async () => {
    const repository = createInMemoryTreatmentRepository({
      protocol: createProtocol({
        stages: [{ id: 'early', order: 1, title: 'synthetic-early', startDayOffset: 0, endDayOffset: 2 }],
        tasks: [{ id: 'on-start', stageId: 'early', title: 'synthetic-start', dayOffsets: [0] }],
      }),
      treatmentId: 'treatment-1',
      startDate: ON_DATE,
    });

    await expect(loadTodayOverview(repository, ON_DATE)).resolves.toEqual({
      status: 'ready',
      overview: {
        kind: 'ready',
        patientId: 'dev-patient-1',
        treatmentId: 'treatment-1',
        protocolKind: 'sclerotherapy',
        protocolVersion: 1,
        currentStage: { id: 'early', title: 'synthetic-early' },
        tasks: [{ id: 'on-start', title: 'synthetic-start' }],
      },
    });
  });

  it('returns no_active_treatment when the repository resolves null', async () => {
    const repository = createInMemoryTreatmentRepository({ empty: true });

    await expect(loadTodayOverview(repository, ON_DATE)).resolves.toEqual({
      status: 'no_active_treatment',
    });
  });

  it('returns error when the repository rejects', async () => {
    await expect(loadTodayOverview(rejectingRepository(), ON_DATE)).resolves.toEqual({
      status: 'error',
    });
  });
});

describe('createTodayLoader', () => {
  const now = () => new Date(AT);

  it('emits one contextual app_opened for an active treatment', async () => {
    const sink = createInMemoryProductEventSink();
    const loader = createTodayLoader({
      repository: createInMemoryTreatmentRepository({
        protocol: createProtocol(),
        treatmentId: 'treatment-1',
        startDate: ON_DATE,
      }),
      eventSink: sink,
      now,
    });

    await expect(loader.load(ON_DATE)).resolves.toMatchObject({ status: 'ready' });
    expect(sink.getAll()).toEqual([
      {
        name: 'app_opened',
        at: AT,
        pilotCohort: DEVELOPMENT_PILOT_COHORT,
        patientId: 'dev-patient-1',
        treatmentId: 'treatment-1',
        protocolKind: 'sclerotherapy',
        protocolVersion: 1,
      },
    ]);
  });

  it('emits one base app_opened when there is no active treatment', async () => {
    const sink = createInMemoryProductEventSink();
    const loader = createTodayLoader({
      repository: createInMemoryTreatmentRepository({ empty: true }),
      eventSink: sink,
      now,
    });

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
    const loader = createTodayLoader({
      repository: rejectingRepository(),
      eventSink: sink,
      now,
    });

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
    };
    const loader = createTodayLoader({
      repository,
      eventSink: sink,
      now,
    });

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

  it('does not include clinical or free-text fields on app_opened', async () => {
    const sink = createInMemoryProductEventSink();
    const loader = createTodayLoader({
      repository: createInMemoryTreatmentRepository({
        protocol: createProtocol({
          stages: [
            {
              id: 'early',
              order: 1,
              title: 'synthetic-clinical-title',
              summary: 'synthetic-clinical-summary',
              startDayOffset: 0,
              endDayOffset: 2,
            },
          ],
          tasks: [
            {
              id: 'on-start',
              stageId: 'early',
              title: 'synthetic-task-title',
              instruction: 'synthetic-task-instruction',
              dayOffsets: [0],
            },
          ],
        }),
        treatmentId: 'treatment-1',
        startDate: ON_DATE,
      }),
      eventSink: sink,
      now,
    });

    await loader.load(ON_DATE);

    const event = sink.getAll()[0];
    expect(event).toEqual({
      name: 'app_opened',
      at: AT,
      pilotCohort: DEVELOPMENT_PILOT_COHORT,
      patientId: 'dev-patient-1',
      treatmentId: 'treatment-1',
      protocolKind: 'sclerotherapy',
      protocolVersion: 1,
    });
    expect(event).not.toHaveProperty('title');
    expect(event).not.toHaveProperty('instruction');
    expect(event).not.toHaveProperty('summary');
    expect(event).not.toHaveProperty('answers');
    expect(event).not.toHaveProperty('photoUrl');
    expect(JSON.stringify(event)).not.toContain('synthetic-clinical');
    expect(JSON.stringify(event)).not.toContain('synthetic-task');
  });
});
