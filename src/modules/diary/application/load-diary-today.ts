import { isActiveTreatment, type CalendarDate } from '@/modules/treatment/domain';
import type { TreatmentRepository } from '@/modules/treatment/infrastructure';

import { isDiaryOpenOnDate } from '../domain';
import type { DiaryRepository } from '../infrastructure';

import { buildDiaryHistory, type DiaryHistoryItem } from './build-diary-history';

export type { DiaryHistoryItem };

export type DiaryTodayResult =
  | {
      status: 'open';
      patientId: string;
      treatmentId: string;
      history: readonly DiaryHistoryItem[];
    }
  | {
      status: 'completed';
      patientId: string;
      treatmentId: string;
      history: readonly DiaryHistoryItem[];
    }
  | { status: 'no_active_treatment' }
  | { status: 'error' };

export async function loadDiaryToday(
  treatmentRepository: TreatmentRepository,
  diaryRepository: DiaryRepository,
  onDate: CalendarDate,
): Promise<DiaryTodayResult> {
  try {
    const treatment = await treatmentRepository.getActiveTreatment();
    if (treatment === null || !isActiveTreatment(treatment)) {
      return { status: 'no_active_treatment' };
    }

    const entries = await diaryRepository.listEntries(treatment.id);
    if (isDiaryOpenOnDate(treatment, entries, onDate)) {
      return {
        status: 'open',
        patientId: treatment.patientId,
        treatmentId: treatment.id,
        history: buildDiaryHistory(entries, { excludeDate: onDate }),
      };
    }

    return {
      status: 'completed',
      patientId: treatment.patientId,
      treatmentId: treatment.id,
      history: buildDiaryHistory(entries),
    };
  } catch {
    return { status: 'error' };
  }
}
