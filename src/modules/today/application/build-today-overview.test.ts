import { calendarDate, createTreatment, type TreatmentStatus } from '@/modules/treatment/domain';

import { buildTodayOverview } from './build-today-overview';

function create(
  options: {
    status?: TreatmentStatus;
    periods?: Parameters<typeof createTreatment>[0]['periods'];
    assignments?: Parameters<typeof createTreatment>[0]['assignments'];
    completions?: Parameters<typeof createTreatment>[0]['completions'];
  } = {},
) {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    status: options.status,
    periods: options.periods,
    assignments: options.assignments,
    completions: options.completions,
  });
}

describe('buildTodayOverview', () => {
  it('returns Day N from the current period start', () => {
    const treatment = create({
      periods: [{ id: 'current', startedOn: calendarDate(2026, 8, 1) }],
    });

    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 1))).toMatchObject({
      kind: 'ready',
      periodDayNumber: 1,
    });
    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 4))).toMatchObject({
      kind: 'ready',
      periodDayNumber: 4,
    });
  });

  it('returns active assignments whose inclusive range contains the requested date', () => {
    const treatment = create({
      assignments: [
        {
          id: 'on-start',
          catalogItemId: 'catalog-1',
          title: 'synthetic-start',
          startDate: calendarDate(2026, 8, 1),
          endDate: calendarDate(2026, 8, 1),
          status: 'active',
        },
        {
          id: 'on-day-3',
          catalogItemId: 'catalog-2',
          title: 'synthetic-day-3',
          instruction: 'synthetic-instruction',
          startDate: calendarDate(2026, 8, 3),
          endDate: calendarDate(2026, 8, 4),
          status: 'active',
        },
        {
          id: 'disabled',
          catalogItemId: 'catalog-3',
          title: 'synthetic-disabled',
          startDate: calendarDate(2026, 8, 1),
          endDate: calendarDate(2026, 8, 10),
          status: 'disabled',
        },
      ],
    });

    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 1))).toMatchObject({
      kind: 'ready',
      assignments: [{ id: 'on-start', title: 'synthetic-start', completed: false }],
    });
    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 4))).toMatchObject({
      kind: 'ready',
      assignments: [
        {
          id: 'on-day-3',
          title: 'synthetic-day-3',
          instruction: 'synthetic-instruction',
          completed: false,
        },
      ],
    });
  });

  it('overlays completion state for the requested civil date only', () => {
    const treatment = create({
      assignments: [
        {
          id: 'on-start',
          catalogItemId: 'catalog-1',
          title: 'synthetic-start',
          startDate: calendarDate(2026, 8, 1),
          endDate: calendarDate(2026, 8, 3),
          status: 'active',
        },
      ],
      completions: [
        {
          id: 'completion-1',
          assignmentId: 'on-start',
          completedOn: calendarDate(2026, 8, 1),
        },
      ],
    });

    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 1))).toMatchObject({
      assignments: [{ id: 'on-start', completed: true }],
    });
    expect(buildTodayOverview(treatment, calendarDate(2026, 8, 2))).toMatchObject({
      assignments: [{ id: 'on-start', completed: false }],
    });
  });

  it('returns no assignments outside their date range and no Day N before the period starts', () => {
    const treatment = create({
      periods: [{ id: 'current', startedOn: calendarDate(2026, 8, 1) }],
      assignments: [
        {
          id: 'on-start',
          catalogItemId: 'catalog-1',
          startDate: calendarDate(2026, 8, 1),
          endDate: calendarDate(2026, 8, 1),
          status: 'active',
        },
      ],
    });

    const before = buildTodayOverview(treatment, calendarDate(2026, 7, 31));
    const after = buildTodayOverview(treatment, calendarDate(2026, 8, 20));

    expect(before).toMatchObject({ kind: 'ready', periodDayNumber: null, assignments: [] });
    expect(after).toMatchObject({ kind: 'ready', periodDayNumber: 20, assignments: [] });
  });

  it('returns a ready overview with empty collections for an active treatment', () => {
    const overview = buildTodayOverview(create(), calendarDate(2026, 8, 1));

    expect(overview).toEqual({
      kind: 'ready',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      periodDayNumber: null,
      assignments: [],
    });
    expect(overview).not.toHaveProperty('protocolKind');
    expect(overview).not.toHaveProperty('protocolVersion');
    expect(overview).not.toHaveProperty('currentStage');
    expect(overview).not.toHaveProperty('tasks');
    expect(overview).not.toHaveProperty('nextAppointment');
  });

  it('returns no_active_treatment when treatment is missing or not active', () => {
    expect(buildTodayOverview(null, calendarDate(2026, 8, 1))).toEqual({
      kind: 'no_active_treatment',
    });
    expect(buildTodayOverview(create({ status: 'completed' }), calendarDate(2026, 8, 1)).kind).toBe(
      'no_active_treatment',
    );
    expect(buildTodayOverview(create({ status: 'cancelled' }), calendarDate(2026, 8, 1)).kind).toBe(
      'no_active_treatment',
    );
  });

  it('does not invent medical instructions or thresholds', () => {
    const overview = buildTodayOverview(create(), calendarDate(2026, 8, 1));
    const json = JSON.stringify(overview);

    expect(json).not.toContain('TBD by clinic');
    expect(json).not.toContain('threshold');
    expect(json).not.toContain('диагноз');
  });
});
