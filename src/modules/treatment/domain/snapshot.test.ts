import { calendarDate } from './calendar-date';
import { assignTreatment } from './snapshot';
import type { PilotProtocol, ProtocolStage, ProtocolTask } from './types';

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

function assign(protocol: PilotProtocol) {
  return assignTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    protocol,
    startDate: calendarDate(2026, 8, 19),
  });
}

describe('assignTreatment', () => {
  it('preserves the assigned protocol version on Treatment', () => {
    const protocol = createProtocol({ version: 1 });
    const treatment = assign(protocol);

    expect(treatment.protocolId).toBe('protocol-sclerotherapy');
    expect(treatment.protocolVersion).toBe(1);
    expect(treatment.snapshot.version).toBe(1);
    expect(treatment.snapshot.kind).toBe('sclerotherapy');
    expect(treatment.status).toBe('active');
  });

  it('keeps the snapshot independent from later mutation of the source protocol', () => {
    const stages: ProtocolStage[] = [{ id: 'stage-1', order: 1, title: 'Original' }];
    const tasks: ProtocolTask[] = [
      { id: 'task-1', stageId: 'stage-1', title: 'Original task', dayOffsets: [0] },
    ];
    const protocol = createProtocol({
      version: 1,
      stages,
      tasks,
    });
    const treatment = assign(protocol);

    expect(treatment.snapshot.stages).not.toBe(protocol.stages);
    expect(treatment.snapshot.stages[0]).not.toBe(protocol.stages[0]);
    expect(treatment.snapshot.tasks).not.toBe(protocol.tasks);
    expect(treatment.snapshot.tasks[0]).not.toBe(protocol.tasks[0]);
    expect(treatment.snapshot.tasks[0].dayOffsets).not.toBe(protocol.tasks[0].dayOffsets);

    protocol.version = 2;
    protocol.kind = 'telangiectasia';
    stages[0].title = 'Changed';
    stages.push({ id: 'stage-2', order: 2, title: 'Later stage' });
    tasks[0].title = 'Changed task';
    (tasks[0].dayOffsets as number[]).push(99);

    expect(treatment.protocolVersion).toBe(1);
    expect(treatment.snapshot.version).toBe(1);
    expect(treatment.snapshot.kind).toBe('sclerotherapy');
    expect(treatment.snapshot.stages).toHaveLength(1);
    expect(treatment.snapshot.stages[0].title).toBe('Original');
    expect(treatment.snapshot.tasks).toHaveLength(1);
    expect(treatment.snapshot.tasks[0].title).toBe('Original task');
    expect(treatment.snapshot.tasks[0].dayOffsets).toEqual([0]);
  });

  it('freezes the snapshot without freezing the caller protocol', () => {
    const stages: ProtocolStage[] = [{ id: 'stage-1', order: 1, title: 'Original' }];
    const protocol = createProtocol({
      stages,
      tasks: [{ id: 'task-1', stageId: 'stage-1', dayOffsets: [0] }],
    });
    const treatment = assign(protocol);

    expect(Object.isFrozen(treatment.snapshot)).toBe(true);
    expect(Object.isFrozen(treatment.snapshot.stages)).toBe(true);
    expect(Object.isFrozen(treatment.snapshot.stages[0])).toBe(true);
    expect(Object.isFrozen(treatment.snapshot.tasks)).toBe(true);
    expect(Object.isFrozen(treatment.snapshot.tasks[0])).toBe(true);
    expect(Object.isFrozen(treatment.snapshot.tasks[0].dayOffsets)).toBe(true);

    expect(Object.isFrozen(protocol)).toBe(false);
    expect(Object.isFrozen(protocol.stages)).toBe(false);
    expect(Object.isFrozen(protocol.tasks)).toBe(false);

    try {
      (treatment.snapshot as { version: number }).version = 9;
    } catch {
      // Assignment to a frozen property throws in strict mode.
    }
    expect(treatment.snapshot.version).toBe(1);

    stages.push({ id: 'stage-2', order: 2 });
    expect(protocol.stages).toHaveLength(2);
    expect(treatment.snapshot.stages).toHaveLength(1);
  });

  it('assigns a protocol with empty collections', () => {
    const treatment = assign(createProtocol());

    expect(treatment.snapshot.stages).toEqual([]);
    expect(treatment.snapshot.tasks).toEqual([]);
    expect(treatment.snapshot.checkInDefinitions).toEqual([]);
    expect(treatment.snapshot.photoCheckpoints).toEqual([]);
    expect(treatment.snapshot.restrictions).toEqual([]);
    expect(treatment.snapshot.appointmentPattern).toEqual([]);
  });

  it.each([0, 1.5, -1])('rejects invalid protocol version %s', (version) => {
    expect(() => assign(createProtocol({ version }))).toThrow();
  });
});
