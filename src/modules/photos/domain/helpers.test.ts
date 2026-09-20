import { calendarDate } from '@/modules/treatment/domain';

import { createPatientPhoto } from './create-patient-photo';
import { nextPatientPhotoSlot } from './helpers';

const ON_DATE = calendarDate(2026, 8, 19);

function photo(slot: 1 | 2 | 3) {
  return createPatientPhoto({
    id: `photo-${slot}`,
    treatmentId: 'treatment-1',
    patientId: 'patient-1',
    submittedOn: ON_DATE,
    slot,
  });
}

describe('nextPatientPhotoSlot', () => {
  it('returns the lowest unused slot', () => {
    expect(nextPatientPhotoSlot([], ON_DATE)).toBe(1);
    expect(nextPatientPhotoSlot([photo(1)], ON_DATE)).toBe(2);
    expect(nextPatientPhotoSlot([photo(1), photo(3)], ON_DATE)).toBe(2);
    expect(nextPatientPhotoSlot([photo(1), photo(2), photo(3)], ON_DATE)).toBeNull();
  });
});
