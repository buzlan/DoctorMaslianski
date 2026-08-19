import { calendarDate } from './calendar-date';
import {
  getCurrentStage,
  getProgressSummary,
  getTasksForDate,
  isActiveTreatment,
} from './helpers';
import { assignTreatment } from './snapshot';
import type { PilotProtocol, ProtocolStage, ProtocolTask, TreatmentStatus } from './types';

function createProtocol(overrides: Partial<PilotProtocol> = {}): PilotProtocol {
  return {
    id: 'protocol-telangiectasia',
    kind: 'telangiectasia',
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

function assign(
  protocol: PilotProtocol,
  options: { status?: TreatmentStatus } = {},
) {
  return assignTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    protocol,
    startDate: calendarDate(2026, 8, 1),
    status: options.status,
  });
}

describe('getCurrentStage', () => {
  const stages: ProtocolStage[] = [
    { id: 'early', order: 2, startDayOffset: 0, endDayOffset: 2 },
    { id: 'later', order: 3, startDayOffset: 3, endDayOffset: 6 },
  ];

  it('returns the stage whose window contains the day index', () => {
    const treatment = assign(createProtocol({ stages }));

    expect(getCurrentStage(treatment, calendarDate(2026, 8, 1))?.id).toBe('early');
    expect(getCurrentStage(treatment, calendarDate(2026, 8, 4))?.id).toBe('later');
  });

  it('returns null when no window matches', () => {
    const treatment = assign(createProtocol({ stages }));
    expect(getCurrentStage(treatment, calendarDate(2026, 8, 20))).toBeNull();
  });

  it('returns null when stages are empty', () => {
    const treatment = assign(createProtocol());
    expect(getCurrentStage(treatment, calendarDate(2026, 8, 1))).toBeNull();
  });

  it('ignores stages that are missing a start or end offset', () => {
    const treatment = assign(
      createProtocol({
        stages: [
          { id: 'no-window', order: 1, title: 'Unspecified' },
          { id: 'start-only', order: 2, startDayOffset: 0 },
          { id: 'end-only', order: 3, endDayOffset: 10 },
        ],
      }),
    );

    expect(getCurrentStage(treatment, calendarDate(2026, 8, 1))).toBeNull();
  });

  it('picks the matching stage with the lowest order, then original array order', () => {
    const treatment = assign(
      createProtocol({
        stages: [
          { id: 'second', order: 5, startDayOffset: 0, endDayOffset: 2 },
          { id: 'first-same-order', order: 1, startDayOffset: 0, endDayOffset: 2 },
          { id: 'also-order-1', order: 1, startDayOffset: 0, endDayOffset: 2 },
        ],
      }),
    );

    expect(getCurrentStage(treatment, calendarDate(2026, 8, 1))?.id).toBe('first-same-order');
  });

  it('returns null before start unless a window includes the negative index', () => {
    const treatment = assign(createProtocol({ stages }));
    expect(getCurrentStage(treatment, calendarDate(2026, 7, 31))).toBeNull();

    const withNegativeWindow = assign(
      createProtocol({
        stages: [{ id: 'before-start', order: 1, startDayOffset: -2, endDayOffset: -1 }],
      }),
    );
    expect(getCurrentStage(withNegativeWindow, calendarDate(2026, 7, 31))?.id).toBe(
      'before-start',
    );
  });
});

describe('getTasksForDate', () => {
  const tasks: ProtocolTask[] = [
    { id: 'on-start', stageId: 'early', dayOffsets: [0] },
    { id: 'on-day-3', stageId: 'later', dayOffsets: [3, 4] },
    { id: 'unscheduled', stageId: 'early', dayOffsets: [] },
  ];

  it('returns tasks whose dayOffsets include the day index, in snapshot order', () => {
    const treatment = assign(createProtocol({ tasks }));

    expect(getTasksForDate(treatment, calendarDate(2026, 8, 1)).map((task) => task.id)).toEqual([
      'on-start',
    ]);
    expect(getTasksForDate(treatment, calendarDate(2026, 8, 4)).map((task) => task.id)).toEqual([
      'on-day-3',
    ]);
  });

  it('excludes tasks with empty dayOffsets', () => {
    const treatment = assign(createProtocol({ tasks }));
    const ids = getTasksForDate(treatment, calendarDate(2026, 8, 1)).map((task) => task.id);
    expect(ids).not.toContain('unscheduled');
  });

  it('returns no tasks when the snapshot has none', () => {
    const treatment = assign(createProtocol());
    expect(getTasksForDate(treatment, calendarDate(2026, 8, 1))).toEqual([]);
  });

  it('does not infer tasks from the current stage window', () => {
    const treatment = assign(
      createProtocol({
        stages: [{ id: 'early', order: 1, startDayOffset: 0, endDayOffset: 6 }],
        tasks: [{ id: 'stage-task', stageId: 'early', dayOffsets: [5] }],
      }),
    );

    expect(getTasksForDate(treatment, calendarDate(2026, 8, 1))).toEqual([]);
    expect(getTasksForDate(treatment, calendarDate(2026, 8, 6)).map((task) => task.id)).toEqual([
      'stage-task',
    ]);
  });
});

describe('getProgressSummary', () => {
  it('returns structural counts from the snapshot', () => {
    const treatment = assign(
      createProtocol({
        stages: [
          { id: 'early', order: 1, startDayOffset: 0, endDayOffset: 2 },
          { id: 'later', order: 2, startDayOffset: 3, endDayOffset: 6 },
        ],
        tasks: [
          { id: 'task-a', stageId: 'early', dayOffsets: [0] },
          { id: 'task-b', stageId: 'later', dayOffsets: [3] },
        ],
      }),
    );

    expect(getProgressSummary(treatment, calendarDate(2026, 8, 1), new Set(['task-a']))).toEqual({
      stageCount: 2,
      currentStageId: 'early',
      currentStageOrder: 1,
      taskCount: 2,
      completedTaskCount: 1,
    });
  });

  it('returns null current stage fields and zero completed tasks for empty snapshots', () => {
    const treatment = assign(createProtocol());

    expect(getProgressSummary(treatment, calendarDate(2026, 8, 1))).toEqual({
      stageCount: 0,
      currentStageId: null,
      currentStageOrder: null,
      taskCount: 0,
      completedTaskCount: 0,
    });
  });

  it('ignores completed ids that are not on the snapshot', () => {
    const treatment = assign(
      createProtocol({
        tasks: [{ id: 'task-a', stageId: 'early', dayOffsets: [0] }],
      }),
    );

    expect(
      getProgressSummary(treatment, calendarDate(2026, 8, 1), new Set(['task-a', 'unknown']))
        .completedTaskCount,
    ).toBe(1);
  });
});

describe('isActiveTreatment', () => {
  it('is true only for active status', () => {
    const protocol = createProtocol();

    expect(isActiveTreatment(assign(protocol))).toBe(true);
    expect(isActiveTreatment(assign(protocol, { status: 'completed' }))).toBe(false);
    expect(isActiveTreatment(assign(protocol, { status: 'cancelled' }))).toBe(false);
  });
});
