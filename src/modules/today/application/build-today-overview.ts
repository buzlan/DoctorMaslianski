import {
  getCurrentStage,
  getTasksForDate,
  isActiveTreatment,
  type CalendarDate,
  type ProtocolKind,
  type ProtocolStage,
  type ProtocolTask,
  type Treatment,
} from '@/modules/treatment/domain';

export type TodayStageItem = {
  id: string;
  title?: string;
  summary?: string;
};

export type TodayTaskItem = {
  id: string;
  title?: string;
  instruction?: string;
};

export type TodayOverview =
  | { kind: 'no_active_treatment' }
  | {
      kind: 'ready';
      patientId: string;
      treatmentId: string;
      protocolKind: ProtocolKind;
      protocolVersion: number;
      currentStage: TodayStageItem | null;
      tasks: readonly TodayTaskItem[];
    };

function mapStage(stage: ProtocolStage): TodayStageItem {
  const item: TodayStageItem = { id: stage.id };

  if (stage.title !== undefined) {
    item.title = stage.title;
  }

  if (stage.summary !== undefined) {
    item.summary = stage.summary;
  }

  return item;
}

function mapTask(task: ProtocolTask): TodayTaskItem {
  const item: TodayTaskItem = { id: task.id };

  if (task.title !== undefined) {
    item.title = task.title;
  }

  if (task.instruction !== undefined) {
    item.instruction = task.instruction;
  }

  return item;
}

export function buildTodayOverview(
  treatment: Treatment | null,
  onDate: CalendarDate,
): TodayOverview {
  if (treatment === null || !isActiveTreatment(treatment)) {
    return { kind: 'no_active_treatment' };
  }

  const current = getCurrentStage(treatment, onDate);

  return {
    kind: 'ready',
    patientId: treatment.patientId,
    treatmentId: treatment.id,
    protocolKind: treatment.snapshot.kind,
    protocolVersion: treatment.protocolVersion,
    currentStage: current === null ? null : mapStage(current),
    tasks: getTasksForDate(treatment, onDate).map(mapTask),
  };
}
