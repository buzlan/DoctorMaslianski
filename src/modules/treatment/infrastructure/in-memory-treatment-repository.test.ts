import { calendarDate } from '../domain';
import type { PilotProtocol } from '../domain';

import {
  DEVELOPMENT_TREATMENT_ID,
  developmentPatient,
} from './fixtures/pilot-patient';
import { sclerotherapyV1, telangiectasiaV1 } from './fixtures/pilot-protocols';
import {
  createInMemoryTreatmentRepository,
  sharedTreatmentRepository,
} from './in-memory-treatment-repository';

const INTAKE_MARKERS = [
  'TBD by clinic',
  'placeholder structure only',
  'pending clinic confirmation',
];

function createLocalProtocol(overrides: Partial<PilotProtocol> = {}): PilotProtocol {
  return {
    id: 'test-protocol',
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

function copyProtocol(protocol: PilotProtocol): PilotProtocol {
  return {
    ...protocol,
    stages: [...protocol.stages],
    tasks: [...protocol.tasks],
    checkInDefinitions: [...protocol.checkInDefinitions],
    photoCheckpoints: [...protocol.photoCheckpoints],
    restrictions: [...protocol.restrictions],
    appointmentPattern: [...protocol.appointmentPattern],
  };
}

function assertNoIntakeMarkers(value: unknown): void {
  const json = JSON.stringify(value);
  for (const marker of INTAKE_MARKERS) {
    expect(json).not.toContain(marker);
  }
}

describe('pilot protocol fixtures', () => {
  it('matches TASK-026 kind and version without clinical placeholder strings', () => {
    expect(sclerotherapyV1.id).toBe('sclerotherapy-v1');
    expect(sclerotherapyV1.kind).toBe('sclerotherapy');
    expect(sclerotherapyV1.version).toBe(1);

    expect(telangiectasiaV1.id).toBe('telangiectasia-v1');
    expect(telangiectasiaV1.kind).toBe('telangiectasia');
    expect(telangiectasiaV1.version).toBe(1);

    for (const protocol of [sclerotherapyV1, telangiectasiaV1]) {
      expect(protocol.stages).toEqual([]);
      expect(protocol.tasks).toEqual([]);
      expect(protocol.checkInDefinitions).toEqual([]);
      expect(protocol.photoCheckpoints).toEqual([]);
      expect(protocol.restrictions).toEqual([]);
      expect(protocol.appointmentPattern).toEqual([]);
      expect(protocol).not.toHaveProperty('title');
      expect(protocol).not.toHaveProperty('instruction');
      assertNoIntakeMarkers(protocol);
    }
  });
});

describe('createInMemoryTreatmentRepository', () => {
  it('returns the assigned sclerotherapy v1 treatment from the default seed', async () => {
    const repository = createInMemoryTreatmentRepository();
    const treatment = await repository.getActiveTreatment();

    expect(treatment).not.toBeNull();
    expect(treatment?.id).toBe(DEVELOPMENT_TREATMENT_ID);
    expect(treatment?.patientId).toBe(developmentPatient.id);
    expect(treatment?.protocolId).toBe(sclerotherapyV1.id);
    expect(treatment?.protocolVersion).toBe(1);
    expect(treatment?.snapshot.version).toBe(1);
    expect(treatment?.snapshot.kind).toBe('sclerotherapy');
    expect(treatment?.status).toBe('active');
    expect(treatment?.snapshot.stages).toEqual([]);
    expect(treatment?.snapshot.tasks).toEqual([]);
    expect(treatment?.snapshot.checkInDefinitions).toEqual([]);
    expect(treatment?.snapshot.photoCheckpoints).toEqual([]);
    expect(treatment?.snapshot.restrictions).toEqual([]);
    expect(treatment?.snapshot.appointmentPattern).toEqual([]);
    assertNoIntakeMarkers(treatment);
  });

  it('freezes the assigned snapshot', async () => {
    const treatment = await createInMemoryTreatmentRepository().getActiveTreatment();

    expect(treatment).not.toBeNull();
    expect(Object.isFrozen(treatment?.snapshot)).toBe(true);
    expect(Object.isFrozen(treatment?.snapshot.stages)).toBe(true);
    expect(Object.isFrozen(treatment?.snapshot.tasks)).toBe(true);
  });

  it('keeps the stored treatment when a test-local source protocol is mutated after assignment', async () => {
    const localProtocol = copyProtocol(sclerotherapyV1);
    const repository = createInMemoryTreatmentRepository({ protocol: localProtocol });

    localProtocol.version = 2;
    localProtocol.kind = 'telangiectasia';
    localProtocol.stages = [
      {
        id: 'v2-only-stage',
        order: 1,
        title: 'synthetic-v2',
      },
    ];

    const treatment = await repository.getActiveTreatment();

    expect(treatment?.protocolId).toBe('sclerotherapy-v1');
    expect(treatment?.protocolVersion).toBe(1);
    expect(treatment?.snapshot.version).toBe(1);
    expect(treatment?.snapshot.kind).toBe('sclerotherapy');
    expect(treatment?.snapshot.stages).toEqual([]);

    expect(sclerotherapyV1.version).toBe(1);
    expect(sclerotherapyV1.kind).toBe('sclerotherapy');
    expect(sclerotherapyV1.stages).toEqual([]);
  });

  it('does not reconstruct an assigned treatment from a later synthetic protocol version', async () => {
    const assigned = createLocalProtocol({ version: 1 });
    const repository = createInMemoryTreatmentRepository({
      protocol: assigned,
      treatmentId: 'assigned-v1',
    });

    const newerSourceProtocol = createLocalProtocol({
      id: 'test-protocol-v2',
      version: 2,
      stages: [{ id: 'v2-only-stage', order: 1, title: 'synthetic-v2' }],
    });
    const laterRepository = createInMemoryTreatmentRepository({
      protocol: newerSourceProtocol,
      treatmentId: 'assigned-v2',
      startDate: calendarDate(2026, 8, 20),
    });

    const original = await repository.getActiveTreatment();
    const later = await laterRepository.getActiveTreatment();

    expect(original?.id).toBe('assigned-v1');
    expect(original?.protocolVersion).toBe(1);
    expect(original?.snapshot.version).toBe(1);
    expect(original?.snapshot.stages).toEqual([]);

    expect(later?.id).toBe('assigned-v2');
    expect(later?.protocolVersion).toBe(2);
    expect(later?.snapshot.stages).toHaveLength(1);
    expect(later?.snapshot.stages[0]?.id).toBe('v2-only-stage');
  });

  it('isolates factory instances from each other', async () => {
    const sclerotherapyRepo = createInMemoryTreatmentRepository({
      protocol: sclerotherapyV1,
      treatmentId: 'from-sclerotherapy',
    });
    const telangiectasiaRepo = createInMemoryTreatmentRepository({
      protocol: telangiectasiaV1,
      treatmentId: 'from-telangiectasia',
    });

    const sclerotherapyTreatment = await sclerotherapyRepo.getActiveTreatment();
    const telangiectasiaTreatment = await telangiectasiaRepo.getActiveTreatment();

    expect(sclerotherapyTreatment?.id).toBe('from-sclerotherapy');
    expect(sclerotherapyTreatment?.protocolId).toBe('sclerotherapy-v1');
    expect(sclerotherapyTreatment?.snapshot.kind).toBe('sclerotherapy');

    expect(telangiectasiaTreatment?.id).toBe('from-telangiectasia');
    expect(telangiectasiaTreatment?.protocolId).toBe('telangiectasia-v1');
    expect(telangiectasiaTreatment?.snapshot.kind).toBe('telangiectasia');
  });

  it('returns null when seeded empty', async () => {
    const repository = createInMemoryTreatmentRepository({ empty: true });
    await expect(repository.getActiveTreatment()).resolves.toBeNull();
  });
});

describe('sharedTreatmentRepository', () => {
  it('returns the development sclerotherapy v1 assignment', async () => {
    const treatment = await sharedTreatmentRepository.getActiveTreatment();

    expect(treatment?.id).toBe(DEVELOPMENT_TREATMENT_ID);
    expect(treatment?.protocolId).toBe('sclerotherapy-v1');
    expect(treatment?.protocolVersion).toBe(1);
    expect(treatment?.snapshot.version).toBe(1);
    expect(treatment?.status).toBe('active');
  });
});
