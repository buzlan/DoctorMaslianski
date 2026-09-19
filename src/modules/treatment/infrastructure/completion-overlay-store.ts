import { calendarDate, completionIdFor, isSameCalendarDate } from '../domain';
import type { ActionCompletion, CalendarDate } from '../domain';

/**
 * Local overlay of patient assignment completions.
 *
 * This is the only payload TASK-010 persists. It is not a decision to store
 * diary answers, patient photos, or other clinical payloads in the same
 * local store. Local-at-rest requirements must be reviewed before real-patient
 * rollout.
 */
export type CompletionOverlayStore = {
  load(treatmentId: string): Promise<readonly ActionCompletion[]>;
  save(treatmentId: string, completions: readonly ActionCompletion[]): Promise<void>;
};

export const COMPLETION_OVERLAY_VERSION = 1;

export type CompletionOverlayEnvelope = {
  version: typeof COMPLETION_OVERLAY_VERSION;
  treatmentId: string;
  completions: readonly ActionCompletion[];
};

export function completionOverlayStorageKey(treatmentId: string): string {
  return `treatment.completionOverlay.v1:${treatmentId}`;
}

export function serializeCompletionOverlay(
  treatmentId: string,
  completions: readonly ActionCompletion[],
): string {
  const envelope: CompletionOverlayEnvelope = {
    version: COMPLETION_OVERLAY_VERSION,
    treatmentId,
    completions: completions.map((completion) => ({
      id: completion.id,
      assignmentId: completion.assignmentId,
      completedOn: {
        year: completion.completedOn.year,
        month: completion.completedOn.month,
        day: completion.completedOn.day,
      },
    })),
  };

  return JSON.stringify(envelope);
}

export function parseCompletionOverlay(
  raw: string | null,
  treatmentId: string,
): readonly ActionCompletion[] {
  if (raw === null || raw === '') {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!isRecord(parsed)) {
    return [];
  }

  if (parsed.version !== COMPLETION_OVERLAY_VERSION) {
    return [];
  }

  if (parsed.treatmentId !== treatmentId) {
    return [];
  }

  if (!Array.isArray(parsed.completions)) {
    return [];
  }

  const completions: ActionCompletion[] = [];

  for (const item of parsed.completions) {
    const completion = parseActionCompletion(item);
    if (completion === null) {
      continue;
    }

    if (hasCompletion(completions, completion)) {
      continue;
    }

    completions.push(completion);
  }

  return completions;
}

function parseActionCompletion(value: unknown): ActionCompletion | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.assignmentId !== 'string' || value.assignmentId.length === 0) {
    return null;
  }

  const completedOn = parseCalendarDate(value.completedOn);
  if (completedOn === null) {
    return null;
  }

  const id =
    typeof value.id === 'string' && value.id.length > 0
      ? value.id
      : completionIdFor(value.assignmentId, completedOn);

  return {
    id,
    assignmentId: value.assignmentId,
    completedOn,
  };
}

function parseCalendarDate(value: unknown): CalendarDate | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.year !== 'number' ||
    typeof value.month !== 'number' ||
    typeof value.day !== 'number'
  ) {
    return null;
  }

  try {
    return calendarDate(value.year, value.month, value.day);
  } catch {
    return null;
  }
}

function hasCompletion(
  completions: readonly ActionCompletion[],
  candidate: ActionCompletion,
): boolean {
  return completions.some(
    (completion) =>
      completion.assignmentId === candidate.assignmentId &&
      isSameCalendarDate(completion.completedOn, candidate.completedOn),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
