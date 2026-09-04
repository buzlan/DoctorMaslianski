import {
  calendarDate,
  createTreatment,
  type TreatmentMilestone,
  type TreatmentStatus,
} from '@/modules/treatment/domain';
import { createDevelopmentTreatment } from '@/modules/treatment/infrastructure/fixtures/pilot-treatment';

import { buildMilestoneDetail } from './build-milestone-detail';

const ON_DATE = calendarDate(2026, 8, 1);

function create(
  options: {
    status?: TreatmentStatus;
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
    periods: [{ id: 'current', startedOn: ON_DATE }],
    milestones: options.milestones,
    assignments: options.assignments,
    completions: options.completions,
    appointments: options.appointments,
  });
}

describe('buildMilestoneDetail', () => {
  it('copies clinic title and occurredOn when the milestone exists on an active treatment', () => {
    expect(
      buildMilestoneDetail(
        create({
          milestones: [
            {
              id: 'visit-1',
              title: 'synthetic-visit',
              occurredOn: ON_DATE,
            },
          ],
        }),
        'visit-1',
      ),
    ).toEqual({
      kind: 'ready',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      milestone: {
        id: 'visit-1',
        title: 'synthetic-visit',
        occurredOn: ON_DATE,
      },
    });
  });

  it('does not invent a title when the clinic field is absent', () => {
    const detail = buildMilestoneDetail(
      create({
        milestones: [{ id: 'untitled', occurredOn: ON_DATE }],
      }),
      'untitled',
    );

    expect(detail).toEqual({
      kind: 'ready',
      patientId: 'patient-1',
      treatmentId: 'treatment-1',
      milestone: {
        id: 'untitled',
        occurredOn: ON_DATE,
      },
    });
    if (detail.kind !== 'ready') {
      return;
    }
    expect(detail.milestone).not.toHaveProperty('title');
    expect(JSON.stringify(detail)).not.toContain('Этап лечения');
  });

  it('strips kind from the read model', () => {
    const detail = buildMilestoneDetail(
      create({
        milestones: [
          {
            id: 'kinded',
            kind: 'procedure',
            title: 'synthetic-kinded',
            occurredOn: ON_DATE,
          },
        ],
      }),
      'kinded',
    );

    expect(detail).toMatchObject({
      kind: 'ready',
      milestone: { id: 'kinded', title: 'synthetic-kinded', occurredOn: ON_DATE },
    });
    if (detail.kind !== 'ready') {
      return;
    }
    expect(detail.milestone).not.toHaveProperty('kind');
    expect(JSON.stringify(detail)).not.toContain('procedure');
  });

  it('returns not_found for unknown, blank, missing, or inactive treatments', () => {
    const active = create({
      milestones: [{ id: 'visit-1', title: 'synthetic-visit' }],
    });

    expect(buildMilestoneDetail(active, 'missing')).toEqual({ kind: 'not_found' });
    expect(buildMilestoneDetail(active, '')).toEqual({ kind: 'not_found' });
    expect(buildMilestoneDetail(active, '   ')).toEqual({ kind: 'not_found' });
    expect(buildMilestoneDetail(null, 'visit-1')).toEqual({ kind: 'not_found' });
    expect(buildMilestoneDetail(create({ status: 'completed' }), 'visit-1')).toEqual({
      kind: 'not_found',
    });
    expect(buildMilestoneDetail(create({ status: 'cancelled' }), 'visit-1')).toEqual({
      kind: 'not_found',
    });
  });

  it('does not project assignments, completions, appointments, or photos', () => {
    const detail = buildMilestoneDetail(
      create({
        milestones: [{ id: 'visit-1', title: 'synthetic-visit', occurredOn: ON_DATE }],
        assignments: [
          {
            id: 'assignment-1',
            catalogItemId: 'catalog-1',
            title: 'synthetic-assignment',
            startDate: ON_DATE,
            endDate: ON_DATE,
            status: 'active',
          },
        ],
        completions: [
          {
            id: 'completion-1',
            assignmentId: 'assignment-1',
            completedOn: ON_DATE,
          },
        ],
        appointments: [{ id: 'appointment-1', status: 'current', at: '2026-08-20T09:00:00.000Z' }],
      }),
      'visit-1',
    );

    expect(detail).not.toHaveProperty('assignments');
    expect(detail).not.toHaveProperty('completions');
    expect(detail).not.toHaveProperty('appointments');
    expect(detail).not.toHaveProperty('photos');
    expect(JSON.stringify(detail)).not.toContain('synthetic-assignment');
    expect(JSON.stringify(detail)).not.toContain('Preparation');
  });

  it('does not invent a milestone for the empty development fixture', () => {
    expect(buildMilestoneDetail(createDevelopmentTreatment(), 'missing-id')).toEqual({
      kind: 'not_found',
    });
    expect(createDevelopmentTreatment().milestones).toEqual([]);
  });
});
