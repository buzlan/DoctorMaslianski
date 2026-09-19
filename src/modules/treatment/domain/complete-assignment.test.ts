import { calendarDate } from './calendar-date';
import {
  clearAssignmentCompletion,
  completionIdFor,
  recordAssignmentCompletion,
} from './complete-assignment';
import { createTreatment } from './create-treatment';
import { isAssignmentCompletedOnDate } from './helpers';
import type { ActionAssignment, TreatmentStatus } from './types';

const ON_DATE = calendarDate(2026, 8, 1);
const OTHER_DATE = calendarDate(2026, 8, 2);

function assignment(
  options: Partial<ActionAssignment> & Pick<ActionAssignment, 'id'> = { id: 'assignment-1' },
): ActionAssignment {
  return {
    catalogItemId: 'catalog-1',
    startDate: ON_DATE,
    endDate: calendarDate(2026, 8, 7),
    status: 'active',
    ...options,
  };
}

function create(
  options: {
    status?: TreatmentStatus;
    assignments?: readonly ActionAssignment[];
    completions?: Parameters<typeof createTreatment>[0]['completions'];
    periods?: Parameters<typeof createTreatment>[0]['periods'];
    milestones?: Parameters<typeof createTreatment>[0]['milestones'];
  } = {},
) {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    status: options.status,
    periods: options.periods ?? [{ id: 'period-1', startedOn: ON_DATE }],
    milestones: options.milestones,
    assignments: options.assignments ?? [assignment()],
    completions: options.completions,
  });
}

describe('recordAssignmentCompletion', () => {
  it('records a completion keyed by assignment id and civil date', () => {
    const treatment = create();
    const result = recordAssignmentCompletion(treatment, 'assignment-1', ON_DATE);

    expect(result).toMatchObject({
      status: 'recorded',
      alreadyPresent: false,
      completion: {
        id: completionIdFor('assignment-1', ON_DATE),
        assignmentId: 'assignment-1',
        completedOn: ON_DATE,
      },
    });
    if (result.status !== 'recorded') {
      return;
    }
    expect(result.treatment.completions).toEqual([result.completion]);
    expect(isAssignmentCompletedOnDate(result.treatment, 'assignment-1', ON_DATE)).toBe(true);
  });

  it('is idempotent for the same assignment id and civil date', () => {
    const first = recordAssignmentCompletion(create(), 'assignment-1', ON_DATE);
    expect(first.status).toBe('recorded');
    if (first.status !== 'recorded') {
      return;
    }

    const second = recordAssignmentCompletion(first.treatment, 'assignment-1', ON_DATE);

    expect(second).toMatchObject({
      status: 'recorded',
      alreadyPresent: true,
      completion: first.completion,
    });
    if (second.status !== 'recorded') {
      return;
    }
    expect(second.treatment.completions).toHaveLength(1);
    expect(second.treatment.completions[0]?.id).toBe(first.completion.id);
    expect(second.treatment).toBe(first.treatment);
  });

  it('does not mutate the original treatment, assignments, periods, or milestones', () => {
    const treatment = create({
      milestones: [{ id: 'milestone-1' }],
    });
    const completions = treatment.completions;
    const assignments = treatment.assignments;
    const periods = treatment.periods;
    const milestones = treatment.milestones;

    const result = recordAssignmentCompletion(treatment, 'assignment-1', ON_DATE);

    expect(result.status).toBe('recorded');
    expect(treatment.completions).toBe(completions);
    expect(treatment.completions).toEqual([]);
    if (result.status !== 'recorded') {
      return;
    }
    expect(result.treatment.assignments).toBe(assignments);
    expect(result.treatment.periods).toBe(periods);
    expect(result.treatment.milestones).toBe(milestones);
    expect(result.treatment.assignments).toEqual(assignments);
    expect(result.treatment.periods).toEqual(periods);
    expect(result.treatment.milestones).toEqual(milestones);
  });

  it('ignores a missing, disabled, or out-of-range assignment', () => {
    const treatment = create({
      assignments: [
        assignment({ id: 'disabled', status: 'disabled' }),
        assignment({
          id: 'later',
          startDate: calendarDate(2026, 8, 6),
          endDate: calendarDate(2026, 8, 6),
        }),
      ],
    });

    expect(recordAssignmentCompletion(treatment, 'missing', ON_DATE)).toEqual({
      status: 'ignored',
      reason: 'assignment_not_completable_on_date',
    });
    expect(recordAssignmentCompletion(treatment, 'disabled', ON_DATE)).toEqual({
      status: 'ignored',
      reason: 'assignment_not_completable_on_date',
    });
    expect(recordAssignmentCompletion(treatment, 'later', ON_DATE)).toEqual({
      status: 'ignored',
      reason: 'assignment_not_completable_on_date',
    });
    expect(treatment.completions).toEqual([]);
  });

  it('ignores writes when the treatment is not active', () => {
    expect(recordAssignmentCompletion(create({ status: 'completed' }), 'assignment-1', ON_DATE)).toEqual({
      status: 'ignored',
      reason: 'no_active_treatment',
    });
    expect(recordAssignmentCompletion(create({ status: 'cancelled' }), 'assignment-1', ON_DATE)).toEqual({
      status: 'ignored',
      reason: 'no_active_treatment',
    });
  });
});

describe('clearAssignmentCompletion', () => {
  it('removes only the matching assignment id and civil date', () => {
    const first = recordAssignmentCompletion(create(), 'assignment-1', ON_DATE);
    expect(first.status).toBe('recorded');
    if (first.status !== 'recorded') {
      return;
    }
    const withOtherDate = recordAssignmentCompletion(first.treatment, 'assignment-1', OTHER_DATE);
    expect(withOtherDate.status).toBe('recorded');
    if (withOtherDate.status !== 'recorded') {
      return;
    }

    const cleared = clearAssignmentCompletion(withOtherDate.treatment, 'assignment-1', ON_DATE);

    expect(cleared.status).toBe('cleared');
    if (cleared.status !== 'cleared') {
      return;
    }
    expect(cleared.alreadyAbsent).toBe(false);
    expect(cleared.treatment.completions).toEqual([
      {
        id: completionIdFor('assignment-1', OTHER_DATE),
        assignmentId: 'assignment-1',
        completedOn: OTHER_DATE,
      },
    ]);
  });

  it('is idempotent when no matching completion exists', () => {
    const treatment = create();
    const result = clearAssignmentCompletion(treatment, 'assignment-1', ON_DATE);

    expect(result).toEqual({
      status: 'cleared',
      treatment,
      alreadyAbsent: true,
    });
  });

  it('ignores clearing when the assignment is not completable', () => {
    const treatment = create({
      assignments: [assignment({ id: 'disabled', status: 'disabled' })],
      completions: [
        {
          id: 'kept',
          assignmentId: 'disabled',
          completedOn: ON_DATE,
        },
      ],
    });

    expect(clearAssignmentCompletion(treatment, 'disabled', ON_DATE)).toEqual({
      status: 'ignored',
      reason: 'assignment_not_completable_on_date',
    });
    expect(treatment.completions).toHaveLength(1);
  });
});

describe('disabled assignment overlay', () => {
  it('keeps an existing completion when a new treatment is constructed with that assignment disabled', () => {
    const recorded = recordAssignmentCompletion(create(), 'assignment-1', ON_DATE);
    expect(recorded.status).toBe('recorded');
    if (recorded.status !== 'recorded') {
      return;
    }

    const disabled = createTreatment({
      id: recorded.treatment.id,
      patientId: recorded.treatment.patientId,
      periods: recorded.treatment.periods,
      milestones: recorded.treatment.milestones,
      assignments: [
        assignment({
          id: 'assignment-1',
          status: 'disabled',
        }),
      ],
      completions: recorded.treatment.completions,
    });

    expect(disabled.completions).toEqual([recorded.completion]);
    expect(isAssignmentCompletedOnDate(disabled, 'assignment-1', ON_DATE)).toBe(true);
    expect(recordAssignmentCompletion(disabled, 'assignment-1', ON_DATE)).toEqual({
      status: 'ignored',
      reason: 'assignment_not_completable_on_date',
    });
    expect(clearAssignmentCompletion(disabled, 'assignment-1', ON_DATE)).toEqual({
      status: 'ignored',
      reason: 'assignment_not_completable_on_date',
    });
    expect(disabled.completions).toEqual([recorded.completion]);
  });
});
