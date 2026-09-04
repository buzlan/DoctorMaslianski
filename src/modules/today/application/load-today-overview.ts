import {
  DEVELOPMENT_PILOT_COHORT,
  sharedProductEventSink,
  type AppOpenedEvent,
  type ProductEventSink,
} from '@/modules/product-events';
import type { CalendarDate, PilotCohort } from '@/modules/treatment/domain';
import {
  sharedTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { buildTodayOverview, type TodayOverview } from './build-today-overview';

export type TodayLoadResult =
  | { status: 'ready'; overview: Extract<TodayOverview, { kind: 'ready' }> }
  | { status: 'no_active_treatment' }
  | { status: 'error' };

export type TodayLoader = {
  load(onDate: CalendarDate): Promise<TodayLoadResult>;
};

export async function loadTodayOverview(
  repository: TreatmentRepository,
  onDate: CalendarDate,
): Promise<TodayLoadResult> {
  try {
    const treatment = await repository.getActiveTreatment();
    const overview = buildTodayOverview(treatment, onDate);

    if (overview.kind === 'no_active_treatment') {
      return { status: 'no_active_treatment' };
    }

    return { status: 'ready', overview };
  } catch {
    return { status: 'error' };
  }
}

function createAppOpenedEvent(args: {
  result: TodayLoadResult;
  at: string;
  pilotCohort: PilotCohort;
}): AppOpenedEvent {
  if (args.result.status === 'ready') {
    return {
      name: 'app_opened',
      at: args.at,
      pilotCohort: args.pilotCohort,
      patientId: args.result.overview.patientId,
      treatmentId: args.result.overview.treatmentId,
    };
  }

  return {
    name: 'app_opened',
    at: args.at,
    pilotCohort: args.pilotCohort,
  };
}

export function createTodayLoader(deps: {
  repository: TreatmentRepository;
  eventSink: ProductEventSink;
  now?: () => Date;
  pilotCohort?: PilotCohort;
}): TodayLoader {
  const now = deps.now ?? (() => new Date());
  const pilotCohort = deps.pilotCohort ?? DEVELOPMENT_PILOT_COHORT;
  let hasEmittedAppOpened = false;

  return {
    async load(onDate: CalendarDate): Promise<TodayLoadResult> {
      const result = await loadTodayOverview(deps.repository, onDate);

      if (!hasEmittedAppOpened) {
        hasEmittedAppOpened = true;
        await deps.eventSink.append(
          createAppOpenedEvent({
            result,
            at: now().toISOString(),
            pilotCohort,
          }),
        );
      }

      return result;
    },
  };
}

export const sharedTodayLoader = createTodayLoader({
  repository: sharedTreatmentRepository,
  eventSink: sharedProductEventSink,
});
