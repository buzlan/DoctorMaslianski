import {
  assignTreatment,
  calendarDate,
  type PilotProtocol,
  type TreatmentStatus,
} from '@/modules/treatment/domain';

import { buildTodayOverview } from './build-today-overview';

const OPAQUE_TIMING_RULE = 'every morning until swelling resolves';
const OPAQUE_SCHEDULE_RULE = 'day 3 after procedure';
const OPAQUE_WHEN = 'at the follow-up visit';

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

function assign(protocol: PilotProtocol, options: { status?: TreatmentStatus } = {}) {
  return assignTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    protocol,
    startDate: calendarDate(2026, 8, 1),
    status: options.status,
  });
}

describe('buildTodayOverview', () => {
  it('returns the matching synthetic current stage for the requested date', () => {
    const treatment = assign(
      createProtocol({
        stages: [
          {
            id: 'early',
            order: 1,
            title: 'synthetic-early',
            summary: 'synthetic-early-summary',
            startDayOffset: 0,
            endDayOffset: 2,
          },
          {
            id: 'later',
            order: 2,
            title: 'synthetic-later',
            startDayOffset: 3,
            endDayOffset: 6,
          },
        ],
      }),
    );

    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 1))).toMatchObject({
      kind: 'ready',
      currentStage: {
        id: 'early',
        title: 'synthetic-early',
        summary: 'synthetic-early-summary',
      },
    });
    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 4))).toMatchObject({
      kind: 'ready',
      currentStage: { id: 'later', title: 'synthetic-later' },
    });
  });

  it('returns tasks whose dayOffsets include the requested date, in snapshot order', () => {
    const treatment = assign(
      createProtocol({
        tasks: [
          { id: 'on-start', stageId: 'early', title: 'synthetic-start', dayOffsets: [0] },
          {
            id: 'on-day-3',
            stageId: 'later',
            title: 'synthetic-day-3',
            instruction: 'synthetic-instruction',
            dayOffsets: [3, 4],
          },
          { id: 'unscheduled', stageId: 'early', title: 'synthetic-unscheduled', dayOffsets: [] },
        ],
      }),
    );

    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 1))).toMatchObject({
      kind: 'ready',
      tasks: [{ id: 'on-start', title: 'synthetic-start' }],
    });
    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 4))).toMatchObject({
      kind: 'ready',
      tasks: [
        {
          id: 'on-day-3',
          title: 'synthetic-day-3',
          instruction: 'synthetic-instruction',
        },
      ],
    });
  });

  it('returns no current stage or tasks outside configured structural windows', () => {
    const treatment = assign(
      createProtocol({
        stages: [{ id: 'early', order: 1, startDayOffset: 0, endDayOffset: 2 }],
        tasks: [{ id: 'on-start', stageId: 'early', dayOffsets: [0] }],
      }),
    );

    const before = buildTodayOverview(treatment, calendarDate(2026, 7, 31));
    const after = buildTodayOverview(treatment, calendarDate(2026, 8, 20));

    expect(before).toMatchObject({ kind: 'ready', currentStage: null, tasks: [] });
    expect(after).toMatchObject({ kind: 'ready', currentStage: null, tasks: [] });
  });

  it('returns a ready overview with empty collections for an active treatment', () => {
    const overview = buildTodayOverview(assign(createProtocol()), calendarDate(2026, 8, 1));

    expect(overview).toEqual({
      kind: 'ready',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      protocolKind: 'telangiectasia',
      protocolVersion: 1,
      currentStage: null,
      tasks: [],
    });
    expect(overview).not.toHaveProperty('nextAppointment');
    expect(overview).not.toHaveProperty('checkInRequest');
    expect(overview).not.toHaveProperty('photoRequest');
  });

  it('returns no_active_treatment when treatment is missing or not active', () => {
    expect(buildTodayOverview(null, calendarDate(2026, 8, 1))).toEqual({
      kind: 'no_active_treatment',
    });
    expect(
      buildTodayOverview(assign(createProtocol(), { status: 'completed' }), calendarDate(2026, 8, 1))
        .kind,
    ).toBe('no_active_treatment');
    expect(
      buildTodayOverview(assign(createProtocol(), { status: 'cancelled' }), calendarDate(2026, 8, 1))
        .kind,
    ).toBe('no_active_treatment');
  });

  it('does not parse opaque clinic timing strings or infer due-today capabilities', () => {
    const treatment = assign(
      createProtocol({
        stages: [
          {
            id: 'early',
            order: 1,
            title: 'synthetic-early',
            timingRule: OPAQUE_TIMING_RULE,
            startDayOffset: 0,
            endDayOffset: 6,
          },
        ],
        tasks: [
          {
            id: 'unscheduled-text',
            stageId: 'early',
            title: 'synthetic-unscheduled',
            scheduleRule: OPAQUE_SCHEDULE_RULE,
            dayOffsets: [],
          },
          {
            id: 'due',
            stageId: 'early',
            title: 'synthetic-due',
            scheduleRule: OPAQUE_SCHEDULE_RULE,
            dayOffsets: [0],
          },
        ],
        checkInDefinitions: [{ id: 'checkin-1', stageId: 'early' }],
        photoCheckpoints: [{ id: 'photo-1', stageId: 'early', when: OPAQUE_WHEN }],
        appointmentPattern: [{ id: 'appt-1', when: OPAQUE_WHEN }],
      }),
    );

    const overview = buildTodayOverview(treatment, calendarDate(2026, 8, 1));
    const json = JSON.stringify(overview);

    expect(overview).toMatchObject({
      kind: 'ready',
      currentStage: { id: 'early', title: 'synthetic-early' },
      tasks: [{ id: 'due', title: 'synthetic-due' }],
    });
    expect(overview).not.toHaveProperty('nextAppointment');
    expect(overview).not.toHaveProperty('checkInRequest');
    expect(overview).not.toHaveProperty('photoRequest');
    expect(json).not.toContain(OPAQUE_TIMING_RULE);
    expect(json).not.toContain(OPAQUE_SCHEDULE_RULE);
    expect(json).not.toContain(OPAQUE_WHEN);
    expect(json).not.toContain('checkin-1');
    expect(json).not.toContain('photo-1');
    expect(json).not.toContain('appt-1');
  });

  it('does not treat a matching checkInDefinition.stageId as due today', () => {
    const treatment = assign(
      createProtocol({
        stages: [{ id: 'early', order: 1, startDayOffset: 0, endDayOffset: 2 }],
        checkInDefinitions: [{ id: 'checkin-matching-stage', stageId: 'early' }],
      }),
    );

    const overview = buildTodayOverview(treatment, calendarDate(2026, 8, 1));

    expect(overview).toMatchObject({
      kind: 'ready',
      currentStage: { id: 'early' },
      tasks: [],
    });
    expect(overview).not.toHaveProperty('checkInRequest');
    expect(JSON.stringify(overview)).not.toContain('checkin-matching-stage');
  });

  it('does not invent medical instructions or thresholds', () => {
    const overview = buildTodayOverview(assign(createProtocol()), calendarDate(2026, 8, 1));
    const json = JSON.stringify(overview);

    expect(json).not.toContain('TBD by clinic');
    expect(json).not.toContain('threshold');
    expect(json).not.toContain('диагноз');
  });
});
