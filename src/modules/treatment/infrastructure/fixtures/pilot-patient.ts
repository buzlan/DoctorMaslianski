import { calendarDate } from '../../domain';
import type { CalendarDate, Patient } from '../../domain';

export const developmentPatient: Patient = {
  id: 'dev-patient-1',
};

export const DEVELOPMENT_TREATMENT_ID = 'dev-treatment-1';

export const DEVELOPMENT_PERIOD_ID = 'dev-period-1';

export const DEVELOPMENT_TREATMENT_START_DATE: CalendarDate = calendarDate(2026, 8, 19);
