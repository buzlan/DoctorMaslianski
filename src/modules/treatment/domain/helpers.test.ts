import { calendarDate } from './calendar-date';
import { createTreatment } from './create-treatment';
import {
  getAssignmentsForDate,
  getCurrentPeriod,
  getPeriodDayNumber,
  isActiveTreatment,
  isAssignmentCompletedOnDate,
  isDateInInclusiveRange,
} from './helpers';
import type { ActionAssignment, TreatmentStatus } from './types';

function create(options: {
  status?: TreatmentStatus;
  periods?: Parameters<typeof createTreatment>[0]['periods'];
  assignments?: readonly ActionAssignment[];
  completions?: Parameters<typeof createTreatment>[0]['completions'];
} = {}) {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    status: options.status,
    periods: options.periods,
    assignments: options.assignments,
    completions: options.completions,
  });
}

describe('getCurrentPeriod', () => {
  it('returns the open period with no endedOn', () => {
    const treatment = create({
      periods: [
        {
          id: 'past',
          startedOn: calendarDate(2026, 7, 1),
          endedOn: calendarDate(2026, 7, 31),
        },
        { id: 'current', startedOn: calendarDate(2026, 8, 1) },
      ],
    });

    expect(getCurrentPeriod(treatment)?.id).toBe('current');
  });

  it('returns null when every period has endedOn', () => {
    const treatment = create({
      periods: [
        {
          id: 'past',
          startedOn: calendarDate(2026, 7, 1),
          endedOn: calendarDate(2026, 7, 31),
        },
      ],
    });

    expect(getCurrentPeriod(treatment)).toBeNull();
  });

  it('keeps a past period when a later current period is added', () => {
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

    expect(treatment.periods.map((period) => period.id)).toEqual(['first', 'second']);
    expect(getCurrentPeriod(treatment)?.id).toBe('second');
  });

  it('picks the latest startedOn when more than one period is open', () => {
    const treatment = create({
      periods: [
        { id: 'earlier-open', startedOn: calendarDate(2026, 8, 1) },
        { id: 'later-open', startedOn: calendarDate(2026, 8, 10) },
      ],
    });

    expect(getCurrentPeriod(treatment)?.id).toBe('later-open');
  });
});

describe('getPeriodDayNumber', () => {
  const period = {
    id: 'current',
    startedOn: calendarDate(2026, 8, 1),
  };

  it('is 1 on the period start date', () => {
    expect(getPeriodDayNumber(period, calendarDate(2026, 8, 1))).toBe(1);
  });

  it('is 1-based from the period start', () => {
    expect(getPeriodDayNumber(period, calendarDate(2026, 8, 4))).toBe(4);
  });

  it('returns null before the period starts', () => {
    expect(getPeriodDayNumber(period, calendarDate(2026, 7, 31))).toBeNull();
  });

  it('returns null after endedOn', () => {
    const closed = {
      id: 'past',
      startedOn: calendarDate(2026, 8, 1),
      endedOn: calendarDate(2026, 8, 3),
    };

    expect(getPeriodDayNumber(closed, calendarDate(2026, 8, 3))).toBe(3);
    expect(getPeriodDayNumber(closed, calendarDate(2026, 8, 4))).toBeNull();
  });

  it('resets to 1 when a new current period starts', () => {
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
    expect(current).not.toBeNull();
    if (current === null) {
      return;
    }
    expect(getPeriodDayNumber(current, calendarDate(2026, 8, 1))).toBe(1);
  });
});

describe('isDateInInclusiveRange', () => {
  it('includes the start and end dates', () => {
    const start = calendarDate(2026, 8, 1);
    const end = calendarDate(2026, 8, 3);

    expect(isDateInInclusiveRange(calendarDate(2026, 8, 1), start, end)).toBe(true);
    expect(isDateInInclusiveRange(calendarDate(2026, 8, 2), start, end)).toBe(true);
    expect(isDateInInclusiveRange(calendarDate(2026, 8, 3), start, end)).toBe(true);
    expect(isDateInInclusiveRange(calendarDate(2026, 7, 31), start, end)).toBe(false);
    expect(isDateInInclusiveRange(calendarDate(2026, 8, 4), start, end)).toBe(false);
  });
});

describe('getAssignmentsForDate', () => {
  const assignments: ActionAssignment[] = [
    {
      id: 'on-start',
      catalogItemId: 'catalog-1',
      startDate: calendarDate(2026, 8, 1),
      endDate: calendarDate(2026, 8, 1),
      status: 'active',
    },
    {
      id: 'range',
      catalogItemId: 'catalog-2',
      startDate: calendarDate(2026, 8, 3),
      endDate: calendarDate(2026, 8, 5),
      status: 'active',
    },
    {
      id: 'disabled',
      catalogItemId: 'catalog-3',
      startDate: calendarDate(2026, 8, 1),
      endDate: calendarDate(2026, 8, 10),
      status: 'disabled',
    },
  ];

  it('returns active assignments whose inclusive range contains the date', () => {
    const treatment = create({ assignments });

    expect(getAssignmentsForDate(treatment, calendarDate(2026, 8, 1)).map((item) => item.id)).toEqual(
      ['on-start'],
    );
    expect(getAssignmentsForDate(treatment, calendarDate(2026, 8, 4)).map((item) => item.id)).toEqual(
      ['range'],
    );
  });

  it('excludes disabled assignments even when the date is in range', () => {
    const treatment = create({ assignments });
    const ids = getAssignmentsForDate(treatment, calendarDate(2026, 8, 1)).map((item) => item.id);

    expect(ids).not.toContain('disabled');
  });

  it('does not infer assignments from the current period window', () => {
    const treatment = create({
      periods: [{ id: 'current', startedOn: calendarDate(2026, 8, 1) }],
      assignments: [
        {
          id: 'later',
          catalogItemId: 'catalog-1',
          startDate: calendarDate(2026, 8, 6),
          endDate: calendarDate(2026, 8, 6),
          status: 'active',
        },
      ],
    });

    expect(getAssignmentsForDate(treatment, calendarDate(2026, 8, 1))).toEqual([]);
    expect(getAssignmentsForDate(treatment, calendarDate(2026, 8, 6)).map((item) => item.id)).toEqual(
      ['later'],
    );
  });

  it('does not delete a disabled assignment or its completions', () => {
    const treatment = create({
      assignments,
      completions: [
        {
          id: 'completion-disabled',
          assignmentId: 'disabled',
          completedOn: calendarDate(2026, 8, 1),
        },
      ],
    });

    expect(treatment.assignments.some((item) => item.id === 'disabled')).toBe(true);
    expect(treatment.completions.map((item) => item.assignmentId)).toEqual(['disabled']);
    expect(getAssignmentsForDate(treatment, calendarDate(2026, 8, 1)).map((item) => item.id)).not.toContain(
      'disabled',
    );
  });
});

describe('isAssignmentCompletedOnDate', () => {
  it('is true only for a matching assignment id and civil date', () => {
    const treatment = create({
      assignments: [
        {
          id: 'on-start',
          catalogItemId: 'catalog-1',
          startDate: calendarDate(2026, 8, 1),
          endDate: calendarDate(2026, 8, 1),
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

    expect(isAssignmentCompletedOnDate(treatment, 'on-start', calendarDate(2026, 8, 1))).toBe(true);
    expect(isAssignmentCompletedOnDate(treatment, 'on-start', calendarDate(2026, 8, 2))).toBe(false);
    expect(isAssignmentCompletedOnDate(treatment, 'other', calendarDate(2026, 8, 1))).toBe(false);
  });
});

describe('isActiveTreatment', () => {
  it('is true only for active status', () => {
    expect(isActiveTreatment(create())).toBe(true);
    expect(isActiveTreatment(create({ status: 'completed' }))).toBe(false);
    expect(isActiveTreatment(create({ status: 'cancelled' }))).toBe(false);
  });
});
