import { calendarDate } from './calendar-date';
import { createTreatment } from './create-treatment';
import type { ActionAssignment, TreatmentMilestone, TreatmentPeriod } from './types';

describe('createTreatment', () => {
  it('defaults to an active sclerotherapy treatment with empty collections', () => {
    const treatment = createTreatment({
      id: 'treatment-1',
      patientId: 'patient-1',
    });

    expect(treatment).toEqual({
      id: 'treatment-1',
      patientId: 'patient-1',
      treatmentContext: 'sclerotherapy',
      status: 'active',
      periods: [],
      milestones: [],
      assignments: [],
      completions: [],
      appointments: [],
    });
    expect(Object.isFrozen(treatment)).toBe(false);
    expect(Object.isFrozen(treatment.periods)).toBe(false);
    expect(Object.isFrozen(treatment.completions)).toBe(false);
  });

  it('does not rewrite copied rows when the input arrays are mutated later', () => {
    const periods: TreatmentPeriod[] = [
      { id: 'period-1', startedOn: calendarDate(2026, 8, 1) },
    ];
    const assignments: ActionAssignment[] = [
      {
        id: 'assignment-1',
        catalogItemId: 'catalog-1',
        startDate: calendarDate(2026, 8, 1),
        endDate: calendarDate(2026, 8, 7),
        status: 'active',
      },
    ];
    const treatment = createTreatment({
      id: 'treatment-1',
      patientId: 'patient-1',
      periods,
      assignments,
    });

    periods.push({ id: 'period-2', startedOn: calendarDate(2026, 9, 1) });
    assignments.push({
      id: 'assignment-2',
      catalogItemId: 'catalog-2',
      startDate: calendarDate(2026, 9, 1),
      endDate: calendarDate(2026, 9, 7),
      status: 'active',
    });

    expect(treatment.periods).toHaveLength(1);
    expect(treatment.periods[0]?.id).toBe('period-1');
    expect(treatment.assignments).toHaveLength(1);
    expect(treatment.assignments[0]?.id).toBe('assignment-1');
  });

  it('does not rewrite nested CalendarDate values when the input dates are mutated later', () => {
    const startedOn = calendarDate(2026, 8, 1);
    const endedOn = calendarDate(2026, 8, 10);
    const occurredOn = calendarDate(2026, 8, 3);
    const startDate = calendarDate(2026, 8, 1);
    const endDate = calendarDate(2026, 8, 7);
    const completedOn = calendarDate(2026, 8, 2);

    const period: TreatmentPeriod = { id: 'period-1', startedOn, endedOn };
    const milestone: TreatmentMilestone = { id: 'milestone-1', occurredOn };
    const assignment: ActionAssignment = {
      id: 'assignment-1',
      catalogItemId: 'catalog-1',
      title: 'Original title',
      startDate,
      endDate,
      status: 'active',
    };

    const treatment = createTreatment({
      id: 'treatment-1',
      patientId: 'patient-1',
      periods: [period],
      milestones: [milestone],
      assignments: [assignment],
      completions: [
        { id: 'completion-1', assignmentId: 'assignment-1', completedOn },
      ],
    });

    startedOn.day = 19;
    endedOn.day = 20;
    occurredOn.day = 21;
    startDate.day = 22;
    endDate.day = 23;
    completedOn.day = 24;
    period.id = 'mutated-period';
    assignment.title = 'Changed title';
    assignment.status = 'disabled';

    expect(treatment.periods[0]?.id).toBe('period-1');
    expect(treatment.periods[0]?.startedOn).toEqual({ year: 2026, month: 8, day: 1 });
    expect(treatment.periods[0]?.endedOn).toEqual({ year: 2026, month: 8, day: 10 });
    expect(treatment.milestones[0]?.occurredOn).toEqual({ year: 2026, month: 8, day: 3 });
    expect(treatment.assignments[0]?.title).toBe('Original title');
    expect(treatment.assignments[0]?.status).toBe('active');
    expect(treatment.assignments[0]?.startDate).toEqual({ year: 2026, month: 8, day: 1 });
    expect(treatment.assignments[0]?.endDate).toEqual({ year: 2026, month: 8, day: 7 });
    expect(treatment.completions[0]?.completedOn).toEqual({ year: 2026, month: 8, day: 2 });
  });

  it('keeps historical completions when a later assignment is disabled on the input', () => {
    const treatment = createTreatment({
      id: 'treatment-1',
      patientId: 'patient-1',
      assignments: [
        {
          id: 'assignment-1',
          catalogItemId: 'catalog-1',
          startDate: calendarDate(2026, 8, 1),
          endDate: calendarDate(2026, 8, 7),
          status: 'disabled',
        },
      ],
      completions: [
        {
          id: 'completion-1',
          assignmentId: 'assignment-1',
          completedOn: calendarDate(2026, 8, 2),
        },
      ],
    });

    expect(treatment.assignments[0]?.status).toBe('disabled');
    expect(treatment.completions).toEqual([
      {
        id: 'completion-1',
        assignmentId: 'assignment-1',
        completedOn: { year: 2026, month: 8, day: 2 },
      },
    ]);
  });
});
