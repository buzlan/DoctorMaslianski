/**
 * checkin_requested represents a unique daily diary request conceptually.
 * entityId is diaryEntryIdFor(treatmentId, civilDate).
 *
 * The in-process Set only suppresses focus/render duplicates in this session.
 * A process restart may append another checkin_requested for the same civil
 * date. Product metrics must deduplicate checkin_requested by stable entityId
 * (and treatmentId), not by counting raw event rows.
 *
 * TASK-012 does not persist analytics state.
 */

import {
  DEVELOPMENT_PILOT_COHORT,
  type ProductEventSink,
} from '@/modules/product-events';
import type { CalendarDate, PilotCohort } from '@/modules/treatment/domain';

import { diaryEntryIdFor } from '../domain';

export type CheckinEventSession = {
  emitRequestedIfNeeded(input: {
    patientId: string;
    treatmentId: string;
    onDate: CalendarDate;
  }): Promise<void>;
  emitSubmittedIfNeeded(input: {
    patientId: string;
    treatmentId: string;
    onDate: CalendarDate;
  }): Promise<void>;
};

export function createCheckinEventSession(deps: {
  eventSink: ProductEventSink;
  now?: () => Date;
  pilotCohort?: PilotCohort;
}): CheckinEventSession {
  const now = deps.now ?? (() => new Date());
  const pilotCohort = deps.pilotCohort ?? DEVELOPMENT_PILOT_COHORT;
  const requested = new Set<string>();
  const submitted = new Set<string>();

  return {
    async emitRequestedIfNeeded(input) {
      const entityId = diaryEntryIdFor(input.treatmentId, input.onDate);
      if (requested.has(entityId)) {
        return;
      }
      requested.add(entityId);
      await deps.eventSink.append({
        name: 'checkin_requested',
        at: now().toISOString(),
        pilotCohort,
        patientId: input.patientId,
        treatmentId: input.treatmentId,
        entityId,
      });
    },
    async emitSubmittedIfNeeded(input) {
      const entityId = diaryEntryIdFor(input.treatmentId, input.onDate);
      if (submitted.has(entityId)) {
        return;
      }
      submitted.add(entityId);
      await deps.eventSink.append({
        name: 'checkin_submitted',
        at: now().toISOString(),
        pilotCohort,
        patientId: input.patientId,
        treatmentId: input.treatmentId,
        entityId,
      });
    },
  };
}
