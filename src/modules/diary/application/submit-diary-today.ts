import type { CalendarDate } from '@/modules/treatment/domain';
import type { TreatmentRepository } from '@/modules/treatment/infrastructure';

import type { DiaryRepository } from '../infrastructure';

import type { CheckinEventSession } from './checkin-events';
import { loadDiaryToday, type DiaryTodayResult } from './load-diary-today';

export async function submitDiaryToday(
  deps: {
    treatmentRepository: TreatmentRepository;
    diaryRepository: DiaryRepository;
    checkinEvents: CheckinEventSession;
  },
  onDate: CalendarDate,
  answers: { pain: number; swelling: number; wellbeing: string },
): Promise<DiaryTodayResult> {
  let treatment;

  try {
    treatment = await deps.treatmentRepository.getActiveTreatment();
  } catch {
    return { status: 'error' };
  }

  if (treatment === null) {
    return { status: 'no_active_treatment' };
  }

  let submitResult;
  try {
    submitResult = await deps.diaryRepository.submitEntry(treatment, onDate, answers);
  } catch {
    return loadDiaryToday(deps.treatmentRepository, deps.diaryRepository, onDate);
  }

  if (submitResult.status === 'ignored') {
    return { status: 'no_active_treatment' };
  }

  if (!submitResult.alreadyPresent) {
    await deps.checkinEvents.emitSubmittedIfNeeded({
      patientId: treatment.patientId,
      treatmentId: treatment.id,
      onDate,
    });
  }

  return loadDiaryToday(deps.treatmentRepository, deps.diaryRepository, onDate);
}
