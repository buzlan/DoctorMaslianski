import { sharedProductEventSink } from '@/modules/product-events';
import type { CalendarDate } from '@/modules/treatment/domain';
import {
  sharedTreatmentRepository,
  type TreatmentRepository,
} from '@/modules/treatment/infrastructure';

import { sharedDiaryRepository, type DiaryRepository } from '../infrastructure';

import { createCheckinEventSession, type CheckinEventSession } from './checkin-events';
import { loadDiaryToday, type DiaryTodayResult } from './load-diary-today';
import { submitDiaryToday } from './submit-diary-today';

export type DiaryLoader = {
  load(onDate: CalendarDate): Promise<DiaryTodayResult>;
  submit(
    onDate: CalendarDate,
    answers: { pain: number; swelling: number; wellbeing: string },
  ): Promise<DiaryTodayResult>;
};

export function createDiaryLoader(deps: {
  treatmentRepository: TreatmentRepository;
  diaryRepository: DiaryRepository;
  checkinEvents: CheckinEventSession;
}): DiaryLoader {
  return {
    async load(onDate) {
      const result = await loadDiaryToday(
        deps.treatmentRepository,
        deps.diaryRepository,
        onDate,
      );

      if (result.status === 'open') {
        await deps.checkinEvents.emitRequestedIfNeeded({
          patientId: result.patientId,
          treatmentId: result.treatmentId,
          onDate,
        });
      }

      return result;
    },
    submit(onDate, answers) {
      return submitDiaryToday(deps, onDate, answers);
    },
  };
}

export const sharedCheckinEventSession = createCheckinEventSession({
  eventSink: sharedProductEventSink,
});

export const sharedDiaryLoader = createDiaryLoader({
  treatmentRepository: sharedTreatmentRepository,
  diaryRepository: sharedDiaryRepository,
  checkinEvents: sharedCheckinEventSession,
});
