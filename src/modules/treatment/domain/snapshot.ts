import type { CalendarDate } from './calendar-date';
import type {
  AppointmentPatternItem,
  CheckInDefinition,
  PhotoCheckpoint,
  PilotProtocol,
  ProtocolStage,
  ProtocolTask,
  Restriction,
  Treatment,
  TreatmentSnapshot,
  TreatmentStatus,
} from './types';

export type AssignTreatmentInput = {
  id: string;
  patientId: string;
  protocol: PilotProtocol;
  startDate: CalendarDate;
  status?: TreatmentStatus;
};

function cloneStage(stage: ProtocolStage): ProtocolStage {
  const cloned: ProtocolStage = {
    id: stage.id,
    order: stage.order,
  };

  if (stage.title !== undefined) {
    cloned.title = stage.title;
  }
  if (stage.summary !== undefined) {
    cloned.summary = stage.summary;
  }
  if (stage.timingRule !== undefined) {
    cloned.timingRule = stage.timingRule;
  }
  if (stage.startDayOffset !== undefined) {
    cloned.startDayOffset = stage.startDayOffset;
  }
  if (stage.endDayOffset !== undefined) {
    cloned.endDayOffset = stage.endDayOffset;
  }

  return cloned;
}

function cloneTask(task: ProtocolTask): ProtocolTask {
  const cloned: ProtocolTask = {
    id: task.id,
    stageId: task.stageId,
    dayOffsets: [...task.dayOffsets],
  };

  if (task.title !== undefined) {
    cloned.title = task.title;
  }
  if (task.instruction !== undefined) {
    cloned.instruction = task.instruction;
  }
  if (task.scheduleRule !== undefined) {
    cloned.scheduleRule = task.scheduleRule;
  }

  return cloned;
}

function cloneCheckInDefinition(definition: CheckInDefinition): CheckInDefinition {
  const cloned: CheckInDefinition = {
    id: definition.id,
  };

  if (definition.stageId !== undefined) {
    cloned.stageId = definition.stageId;
  }

  return cloned;
}

function clonePhotoCheckpoint(checkpoint: PhotoCheckpoint): PhotoCheckpoint {
  const cloned: PhotoCheckpoint = {
    id: checkpoint.id,
  };

  if (checkpoint.stageId !== undefined) {
    cloned.stageId = checkpoint.stageId;
  }
  if (checkpoint.title !== undefined) {
    cloned.title = checkpoint.title;
  }
  if (checkpoint.when !== undefined) {
    cloned.when = checkpoint.when;
  }
  if (checkpoint.captureNotes !== undefined) {
    cloned.captureNotes = checkpoint.captureNotes;
  }

  return cloned;
}

function cloneRestriction(restriction: Restriction): Restriction {
  const cloned: Restriction = {
    id: restriction.id,
  };

  if (restriction.title !== undefined) {
    cloned.title = restriction.title;
  }
  if (restriction.instruction !== undefined) {
    cloned.instruction = restriction.instruction;
  }
  if (restriction.appliesWhen !== undefined) {
    cloned.appliesWhen = restriction.appliesWhen;
  }

  return cloned;
}

function cloneAppointmentPatternItem(item: AppointmentPatternItem): AppointmentPatternItem {
  const cloned: AppointmentPatternItem = {
    id: item.id,
  };

  if (item.label !== undefined) {
    cloned.label = item.label;
  }
  if (item.when !== undefined) {
    cloned.when = item.when;
  }

  return cloned;
}

function cloneProtocolContent(protocol: PilotProtocol): TreatmentSnapshot {
  return {
    kind: protocol.kind,
    version: protocol.version,
    stages: protocol.stages.map(cloneStage),
    tasks: protocol.tasks.map(cloneTask),
    checkInDefinitions: protocol.checkInDefinitions.map(cloneCheckInDefinition),
    photoCheckpoints: protocol.photoCheckpoints.map(clonePhotoCheckpoint),
    restrictions: protocol.restrictions.map(cloneRestriction),
    appointmentPattern: protocol.appointmentPattern.map(cloneAppointmentPatternItem),
  };
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      deepFreeze(item);
    }
  } else {
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }

  Object.freeze(value);
  return value;
}

function assertValidProtocolVersion(version: number): void {
  if (!Number.isInteger(version) || version < 1) {
    throw new Error('PilotProtocol.version must be an integer >= 1.');
  }
}

export function assignTreatment(input: AssignTreatmentInput): Treatment {
  assertValidProtocolVersion(input.protocol.version);

  return {
    id: input.id,
    patientId: input.patientId,
    protocolId: input.protocol.id,
    protocolVersion: input.protocol.version,
    snapshot: deepFreeze(cloneProtocolContent(input.protocol)),
    startDate: input.startDate,
    status: input.status ?? 'active',
  };
}
