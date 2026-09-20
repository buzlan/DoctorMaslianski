import type { CalendarDate } from '@/modules/treatment/domain';

export type VasScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type Wellbeing = 'better' | 'unchanged' | 'worse';

export type DiaryEntry = {
  id: string;
  treatmentId: string;
  patientId: string;
  submittedOn: CalendarDate;
  pain: VasScore;
  swelling: VasScore;
  wellbeing: Wellbeing;
};
