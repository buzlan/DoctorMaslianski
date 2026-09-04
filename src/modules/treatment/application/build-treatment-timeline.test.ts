import {
  calendarDate,
  createTreatment,
  getCurrentPeriod,
  getPeriodDayNumber,
  type TreatmentMilestone,
  type TreatmentStatus,
} from '@/modules/treatment/domain';
import {
  DEVELOPMENT_PERIOD_ID,
  DEVELOPMENT_TREATMENT_ID,
  DEVELOPMENT_TREATMENT_START_DATE,
  developmentPatient,
} from '@/modules/treatment/infrastructure/fixtures/pilot-patient';
import { createDevelopmentTreatment } from '@/modules/treatment/infrastructure/fixtures/pilot-treatment';

import { buildTreatmentTimeline } from './build-treatment-timeline';

function create(
  options: {
    status?: TreatmentStatus;
    periods?: Parameters<typeof createTreatment>[0]['periods'];
    milestones?: readonly TreatmentMilestone[];
    assignments?: Parameters<typeof createTreatment>[0]['assignments'];
    completions?: Parameters<typeof createTreatment>[0]['completions'];
    appointments?: Parameters<typeof createTreatment>[0]['appointments'];
  } = {},
) {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    status: options.status,
    periods: options.periods,
    milestones: options.milestones,
    assignments: options.assignments,
    completions: options.completions,
    appointments: options.appointments,
  });
}

describe('buildTreatmentTimeline', () => {
  it('returns no_active_treatment when treatment is missing or not active', () => {
    expect(buildTreatmentTimeline(null, calendarDate(2026, 8, 1))).toEqual({
      kind: 'no_active_treatment',
    });
    expect(buildTreatmentTimeline(create({ status: 'completed' }), calendarDate(2026, 8, 1)).kind).toBe(
      'no_active_treatment',
    );
    expect(buildTreatmentTimeline(create({ status: 'cancelled' }), calendarDate(2026, 8, 1)).kind).toBe(
      'no_active_treatment',
    );
  });

  it('returns Day N from the current period using the same helper as Today', () => {
    const treatment = create({
      periods: [{ id: 'current', startedOn: calendarDate(2026, 8, 1) }],
    });
    const current = getCurrentPeriod(treatment);

    expect(current).not.toBeNull();
    if (current === null) {
      return;
    }

    expect(buildTreatmentTimeline(treatment, calendarDate(2026, 8, 1))).toMatchObject({
      kind: 'ready',
      periodDayNumber: getPeriodDayNumber(current, calendarDate(2026, 8, 1)),
      currentPeriodId: 'current',
    });
    expect(buildTreatmentTimeline(treatment, calendarDate(2026, 8, 4))).toMatchObject({
      kind: 'ready',
      periodDayNumber: getPeriodDayNumber(current, calendarDate(2026, 8, 4)),
    });
  });

  it('resets Day N to 1 when a new current period starts', () => {
    const treatment = create({
      periods: [
        {
          id: 'first',
          startedOn: calendarDate(2026, 7, 1),
          endedOn: calendarDate(2026, 7, 31),
        },
        { id: 'second', startedOn: calendarDate(2026, 8, 1) },
      ],
    });
    const current = getCurrentPeriod(treatment);

    expect(current?.id).toBe('second');
    expect(buildTreatmentTimeline(treatment, calendarDate(2026, 8, 1))).toMatchObject({
      kind: 'ready',
      periodDayNumber: 1,
      currentPeriodId: 'second',
    });
  });

  it('groups dated milestones into the period whose window contains occurredOn', () => {
    const treatment = create({
      periods: [
        {
          id: 'first',
          startedOn: calendarDate(2026, 7, 1),
          endedOn: calendarDate(2026, 7, 31),
        },
        { id: 'second', startedOn: calendarDate(2026, 8, 1) },
      ],
      milestones: [
        {
          id: 'later-visit',
          title: 'synthetic-later',
          occurredOn: calendarDate(2026, 8, 3),
        },
        {
          id: 'earlier-visit',
          title: 'synthetic-earlier',
          occurredOn: calendarDate(2026, 7, 10),
        },
        {
          id: 'mid-visit',
          title: 'synthetic-mid',
          occurredOn: calendarDate(2026, 7, 20),
        },
      ],
    });

    const timeline = buildTreatmentTimeline(treatment, calendarDate(2026, 8, 3));

    expect(timeline).toMatchObject({
      kind: 'ready',
      periodDayNumber: 3,
      periods: [
        {
          id: 'second',
          isCurrent: true,
          milestones: [{ id: 'later-visit', title: 'synthetic-later' }],
        },
        {
          id: 'first',
          isCurrent: false,
          milestones: [
            { id: 'earlier-visit', title: 'synthetic-earlier' },
            { id: 'mid-visit', title: 'synthetic-mid' },
          ],
        },
      ],
    });
  });

  it('assigns a same-day overlap visit to the ended period', () => {
    const treatment = create({
      periods: [
        {
          id: 'first',
          startedOn: calendarDate(2026, 7, 1),
          endedOn: calendarDate(2026, 8, 15),
        },
        { id: 'second', startedOn: calendarDate(2026, 8, 15) },
      ],
      milestones: [
        {
          id: 'closing-visit',
          title: 'synthetic-closing',
          occurredOn: calendarDate(2026, 8, 15),
        },
        {
          id: 'next-visit',
          title: 'synthetic-next',
          occurredOn: calendarDate(2026, 8, 16),
        },
      ],
    });

    expect(buildTreatmentTimeline(treatment, calendarDate(2026, 8, 16))).toMatchObject({
      kind: 'ready',
      periodDayNumber: 2,
      periods: [
        {
          id: 'second',
          isCurrent: true,
          milestones: [{ id: 'next-visit' }],
        },
        {
          id: 'first',
          isCurrent: false,
          milestones: [{ id: 'closing-visit' }],
        },
      ],
    });
  });

  it('includes the current period with empty milestones and omits empty ended periods', () => {
    const timeline = buildTreatmentTimeline(
      create({
        periods: [
          {
            id: 'first',
            startedOn: calendarDate(2026, 7, 1),
            endedOn: calendarDate(2026, 7, 31),
          },
          { id: 'second', startedOn: calendarDate(2026, 8, 1) },
        ],
      }),
      calendarDate(2026, 8, 4),
    );

    expect(timeline).toEqual({
      kind: 'ready',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      periodDayNumber: 4,
      currentPeriodId: 'second',
      periods: [
        {
          id: 'second',
          isCurrent: true,
          startedOn: calendarDate(2026, 8, 1),
          milestones: [],
        },
      ],
      ungroupedMilestones: [],
    });
  });

  it('puts previous relevant periods after the current period, newest startedOn first', () => {
    const treatment = create({
      periods: [
        {
          id: 'oldest',
          startedOn: calendarDate(2026, 5, 1),
          endedOn: calendarDate(2026, 5, 31),
        },
        {
          id: 'middle',
          startedOn: calendarDate(2026, 6, 1),
          endedOn: calendarDate(2026, 6, 30),
        },
        { id: 'current', startedOn: calendarDate(2026, 8, 1) },
      ],
      milestones: [
        {
          id: 'oldest-visit',
          title: 'synthetic-oldest',
          occurredOn: calendarDate(2026, 5, 10),
        },
        {
          id: 'middle-visit',
          title: 'synthetic-middle',
          occurredOn: calendarDate(2026, 6, 10),
        },
      ],
    });

    expect(buildTreatmentTimeline(treatment, calendarDate(2026, 8, 1))).toMatchObject({
      periods: [{ id: 'current' }, { id: 'middle' }, { id: 'oldest' }],
    });
  });

  it('does not invent a title when the clinic field is absent', () => {
    const timeline = buildTreatmentTimeline(
      create({
        periods: [{ id: 'current', startedOn: calendarDate(2026, 8, 1) }],
        milestones: [{ id: 'untitled', occurredOn: calendarDate(2026, 8, 2) }],
      }),
      calendarDate(2026, 8, 2),
    );

    expect(timeline).toMatchObject({
      kind: 'ready',
      periods: [{ milestones: [{ id: 'untitled', occurredOn: calendarDate(2026, 8, 2) }] }],
    });
    if (timeline.kind !== 'ready') {
      return;
    }
    expect(timeline.periods[0]?.milestones[0]).not.toHaveProperty('title');
    expect(timeline.periods[0]?.milestones[0]).not.toHaveProperty('kind');
  });

  it('strips kind and leaves undated or unmatched dates ungrouped', () => {
    const timeline = buildTreatmentTimeline(
      create({
        periods: [{ id: 'current', startedOn: calendarDate(2026, 8, 1) }],
        milestones: [
          {
            id: 'kinded',
            kind: 'procedure',
            title: 'synthetic-kinded',
            occurredOn: calendarDate(2026, 8, 2),
          },
          { id: 'undated', title: 'synthetic-undated' },
          {
            id: 'before-periods',
            title: 'synthetic-before',
            occurredOn: calendarDate(2026, 6, 1),
          },
        ],
      }),
      calendarDate(2026, 8, 2),
    );

    expect(timeline).toMatchObject({
      kind: 'ready',
      periods: [{ milestones: [{ id: 'kinded', title: 'synthetic-kinded' }] }],
      ungroupedMilestones: [
        { id: 'before-periods', title: 'synthetic-before' },
        { id: 'undated', title: 'synthetic-undated' },
      ],
    });
    if (timeline.kind !== 'ready') {
      return;
    }
    expect(timeline.periods[0]?.milestones[0]).not.toHaveProperty('kind');
    expect(JSON.stringify(timeline)).not.toContain('procedure');
  });

  it('does not project assignments, completions, appointments, or snapshot fields', () => {
    const timeline = buildTreatmentTimeline(
      create({
        periods: [{ id: 'current', startedOn: calendarDate(2026, 8, 1) }],
        assignments: [
          {
            id: 'assignment-1',
            catalogItemId: 'catalog-1',
            title: 'synthetic-assignment',
            startDate: calendarDate(2026, 8, 1),
            endDate: calendarDate(2026, 8, 1),
            status: 'active',
          },
        ],
        completions: [
          {
            id: 'completion-1',
            assignmentId: 'assignment-1',
            completedOn: calendarDate(2026, 8, 1),
          },
        ],
        appointments: [{ id: 'appointment-1', status: 'current', at: '2026-08-20T09:00:00.000Z' }],
      }),
      calendarDate(2026, 8, 1),
    );

    expect(timeline).not.toHaveProperty('assignments');
    expect(timeline).not.toHaveProperty('completions');
    expect(timeline).not.toHaveProperty('appointments');
    expect(timeline).not.toHaveProperty('protocolKind');
    expect(timeline).not.toHaveProperty('protocolVersion');
    expect(timeline).not.toHaveProperty('currentStage');
    expect(JSON.stringify(timeline)).not.toContain('synthetic-assignment');
    expect(JSON.stringify(timeline)).not.toContain('Preparation');
    expect(JSON.stringify(timeline)).not.toContain('Day 7');
  });

  it('keeps the shared development fixture clinically empty besides Day N', () => {
    const treatment = createDevelopmentTreatment();
    const onDate = calendarDate(2026, 9, 4);
    const current = getCurrentPeriod(treatment);
    const timeline = buildTreatmentTimeline(treatment, onDate);

    expect(current).not.toBeNull();
    if (current === null) {
      return;
    }

    expect(timeline).toEqual({
      kind: 'ready',
      patientId: developmentPatient.id,
      treatmentId: DEVELOPMENT_TREATMENT_ID,
      periodDayNumber: getPeriodDayNumber(current, onDate),
      currentPeriodId: DEVELOPMENT_PERIOD_ID,
      periods: [
        {
          id: DEVELOPMENT_PERIOD_ID,
          isCurrent: true,
          startedOn: DEVELOPMENT_TREATMENT_START_DATE,
          milestones: [],
        },
      ],
      ungroupedMilestones: [],
    });
    expect(JSON.stringify(timeline)).not.toContain('Preparation');
    expect(JSON.stringify(timeline)).not.toContain('TBD by clinic');
  });
});
