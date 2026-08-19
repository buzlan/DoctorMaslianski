import { dayIndex } from './calendar-date';
import type { CalendarDate } from './calendar-date';
import type { ProgressSummary, ProtocolStage, ProtocolTask, Treatment } from './types';

export function getCurrentStage(
  treatment: Treatment,
  onDate: CalendarDate,
): ProtocolStage | null {
  const index = dayIndex(treatment.startDate, onDate);
  let current: ProtocolStage | null = null;

  for (const stage of treatment.snapshot.stages) {
    if (stage.startDayOffset === undefined || stage.endDayOffset === undefined) {
      continue;
    }

    if (index < stage.startDayOffset || index > stage.endDayOffset) {
      continue;
    }

    if (current === null || stage.order < current.order) {
      current = stage;
    }
  }

  return current;
}

export function getTasksForDate(
  treatment: Treatment,
  onDate: CalendarDate,
): readonly ProtocolTask[] {
  const index = dayIndex(treatment.startDate, onDate);
  return treatment.snapshot.tasks.filter((task) => task.dayOffsets.includes(index));
}

export function getProgressSummary(
  treatment: Treatment,
  onDate: CalendarDate,
  completedTaskIds?: ReadonlySet<string>,
): ProgressSummary {
  const current = getCurrentStage(treatment, onDate);
  const snapshotTaskIds = new Set(treatment.snapshot.tasks.map((task) => task.id));
  let completedTaskCount = 0;

  if (completedTaskIds) {
    for (const taskId of completedTaskIds) {
      if (snapshotTaskIds.has(taskId)) {
        completedTaskCount += 1;
      }
    }
  }

  return {
    stageCount: treatment.snapshot.stages.length,
    currentStageId: current?.id ?? null,
    currentStageOrder: current?.order ?? null,
    taskCount: treatment.snapshot.tasks.length,
    completedTaskCount,
  };
}

export function isActiveTreatment(treatment: Treatment): boolean {
  return treatment.status === 'active';
}
