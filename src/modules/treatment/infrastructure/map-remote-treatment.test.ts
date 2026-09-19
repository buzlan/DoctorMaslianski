import { calendarDate } from '../domain';

import {
  applyCompletionOutbox,
  mapRemoteTreatment,
  selectCurrentTreatment,
  wallClockToAppointmentAt,
  type CompletionOutboxPayload,
} from './map-remote-treatment';
import type { WriteOutboxItem } from '@/core/sync/write-outbox';

describe('selectCurrentTreatment', () => {
  it('prefers the active treatment over a newer completed one', () => {
    const selected = selectCurrentTreatment([
      { id: 'completed', status: 'completed', created_at: '2026-09-04T12:00:00.000Z' },
      { id: 'active', status: 'active', created_at: '2026-08-01T12:00:00.000Z' },
    ]);

    expect(selected?.id).toBe('active');
  });

  it('falls back to created_at DESC then id DESC when none are active', () => {
    const selected = selectCurrentTreatment([
      { id: 'a', status: 'cancelled', created_at: '2026-09-01T00:00:00.000Z' },
      { id: 'c', status: 'completed', created_at: '2026-09-04T00:00:00.000Z' },
      { id: 'b', status: 'completed', created_at: '2026-09-04T00:00:00.000Z' },
    ]);

    expect(selected?.id).toBe('c');
  });
});

describe('wallClockToAppointmentAt', () => {
  it('keeps wall-clock components and does not emit a UTC Z suffix', () => {
    expect(wallClockToAppointmentAt('2026-09-04 14:30:00')).toBe('2026-09-04T14:30:00');
    expect(wallClockToAppointmentAt('2026-09-04T14:30:00Z')).toBe('2026-09-04T14:30:00');
  });
});

describe('mapRemoteTreatment', () => {
  it('maps patient-specific records without protocol snapshot fields', () => {
    const treatment = mapRemoteTreatment({
      treatment: {
        id: 't1',
        patient_id: 'p1',
        treatment_context: 'sclerotherapy',
        status: 'active',
        created_at: '2026-08-19T00:00:00.000Z',
      },
      periods: [{ id: 'per1', started_on: '2026-08-19', ended_on: null }],
      milestones: [
        { id: 'm1', title: 'Control', kind: 'control', occurred_on: '2026-08-26' },
      ],
      assignments: [
        {
          id: 'a1',
          catalog_item_id: 'c1',
          title: 'Walk',
          instruction: 'Walk daily',
          start_date: '2026-08-19',
          end_date: '2026-08-30',
          status: 'disabled',
        },
      ],
      completions: [{ id: 'uuid-1', assignment_id: 'a1', completed_on: '2026-08-20' }],
      appointments: [
        { id: 'ap1', wall_clock: '2026-09-04T15:00:00', status: 'superseded' },
        { id: 'ap2', wall_clock: '2026-09-10T11:00:00', status: 'current' },
      ],
    });

    expect(treatment.patientId).toBe('p1');
    expect(treatment.treatmentContext).toBe('sclerotherapy');
    expect(treatment.assignments[0]?.status).toBe('disabled');
    expect(treatment.completions[0]).toEqual({
      id: 'a1:2026-8-20',
      assignmentId: 'a1',
      completedOn: calendarDate(2026, 8, 20),
    });
    expect(treatment.appointments.map((item) => item.status)).toEqual([
      'superseded',
      'current',
    ]);
    expect(treatment).not.toHaveProperty('protocolKind');
    expect(treatment).not.toHaveProperty('protocolVersion');
  });
});

describe('applyCompletionOutbox', () => {
  const items: WriteOutboxItem<CompletionOutboxPayload>[] = [
    {
      id: '1',
      authUserId: 'user-a',
      treatmentId: 't1',
      createdAt: 'a',
      payload: { op: 'insert', assignmentId: 'a1', completedOn: '2026-08-20' },
    },
    {
      id: '2',
      authUserId: 'user-a',
      treatmentId: 't1',
      createdAt: 'b',
      payload: { op: 'delete', assignmentId: 'a1', completedOn: '2026-08-20' },
    },
    {
      id: '3',
      authUserId: 'user-b',
      treatmentId: 't1',
      createdAt: 'c',
      payload: { op: 'insert', assignmentId: 'a1', completedOn: '2026-08-20' },
    },
  ];

  it('applies FIFO complete then uncomplete as net uncompleted and ignores other users', () => {
    const merged = applyCompletionOutbox([], items, 'user-a', 't1');
    expect(merged).toEqual([]);
  });
});
