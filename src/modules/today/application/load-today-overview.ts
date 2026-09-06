import {
  sharedCheckinEventSession,
  type CheckinEventSession,
} from '@/modules/diary/application';
import {
  sharedDiaryRepository,
  type DiaryRepository,
} from '@/modules/diary/infrastructure';
import { countPatientPhotosOnDate } from '@/modules/photos/domain';
import {
  sharedPatientPhotoRepository,
  type PatientPhotoRepository,
} from '@/modules/photos/infrastructure';
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
import {
  completeTodayAssignment,
  uncompleteTodayAssignment,
} from './complete-today-assignment';

export type TodayLoadResult =
  | { status: 'ready'; overview: Extract<TodayOverview, { kind: 'ready' }> }
  | { status: 'no_active_treatment' }
  | { status: 'error' };

export type TodayLoader = {
  load(onDate: CalendarDate): Promise<TodayLoadResult>;
  completeAssignment(assignmentId: string, onDate: CalendarDate): Promise<TodayLoadResult>;
  uncompleteAssignment(assignmentId: string, onDate: CalendarDate): Promise<TodayLoadResult>;
};

export async function loadTodayOverview(
  repository: TreatmentRepository,
  diaryRepository: DiaryRepository,
  photoRepository: PatientPhotoRepository,
  onDate: CalendarDate,
): Promise<TodayLoadResult> {
  try {
    const treatment = await repository.getActiveTreatment();
    if (treatment === null) {
      return { status: 'no_active_treatment' };
    }

    const todayEntry = await diaryRepository.getEntryOnDate(treatment.id, onDate);
    const photos = await photoRepository.listPhotos(treatment.id);
    const overview = buildTodayOverview(
      treatment,
      onDate,
      todayEntry !== null,
      countPatientPhotosOnDate(photos, onDate),
    );

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
  diaryRepository: DiaryRepository;
  photoRepository: PatientPhotoRepository;
  eventSink: ProductEventSink;
  checkinEvents: CheckinEventSession;
  now?: () => Date;
  pilotCohort?: PilotCohort;
}): TodayLoader {
  const now = deps.now ?? (() => new Date());
  const pilotCohort = deps.pilotCohort ?? DEVELOPMENT_PILOT_COHORT;
  let hasEmittedAppOpened = false;

  return {
    async load(onDate: CalendarDate): Promise<TodayLoadResult> {
      const result = await loadTodayOverview(
        deps.repository,
        deps.diaryRepository,
        deps.photoRepository,
        onDate,
      );

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

      if (result.status === 'ready' && result.overview.diaryOpen) {
        await deps.checkinEvents.emitRequestedIfNeeded({
          patientId: result.overview.patientId,
          treatmentId: result.overview.treatmentId,
          onDate,
        });
      }

      return result;
    },
    completeAssignment(assignmentId: string, onDate: CalendarDate) {
      return completeTodayAssignment(
        {
          repository: deps.repository,
          diaryRepository: deps.diaryRepository,
          photoRepository: deps.photoRepository,
          eventSink: deps.eventSink,
          now,
          pilotCohort,
        },
        assignmentId,
        onDate,
      );
    },
    uncompleteAssignment(assignmentId: string, onDate: CalendarDate) {
      return uncompleteTodayAssignment(
        {
          repository: deps.repository,
          diaryRepository: deps.diaryRepository,
          photoRepository: deps.photoRepository,
        },
        assignmentId,
        onDate,
      );
    },
  };
}

export const sharedTodayLoader = createTodayLoader({
  repository: sharedTreatmentRepository,
  diaryRepository: sharedDiaryRepository,
  photoRepository: sharedPatientPhotoRepository,
  eventSink: sharedProductEventSink,
  checkinEvents: sharedCheckinEventSession,
});
