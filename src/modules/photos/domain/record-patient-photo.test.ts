import { calendarDate, createTreatment, type TreatmentStatus } from '@/modules/treatment/domain';

import { createPatientPhoto } from './create-patient-photo';
import { countPatientPhotosOnDate, nextPatientPhotoSlot } from './helpers';
import { recordPatientPhoto } from './record-patient-photo';
import type { PatientPhoto } from './types';

const ON_DATE = calendarDate(2026, 8, 19);
const OTHER_DATE = calendarDate(2026, 8, 20);

function create(options: { status?: TreatmentStatus } = {}) {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    status: options.status,
    periods: [{ id: 'period-1', startedOn: ON_DATE }],
  });
}

function photo(slot: 1 | 2 | 3, onDate = ON_DATE): PatientPhoto {
  return createPatientPhoto({
    id: `photo-${slot}-${onDate.day}`,
    treatmentId: 'treatment-1',
    patientId: 'patient-1',
    submittedOn: onDate,
    slot,
  });
}

describe('recordPatientPhoto', () => {
  it('records up to three photos on one civil date', () => {
    const first = recordPatientPhoto({
      treatment: create(),
      existingPhotos: [],
      onDate: ON_DATE,
      photo: photo(1),
    });
    expect(first.status).toBe('recorded');
    if (first.status !== 'recorded') {
      return;
    }

    const second = recordPatientPhoto({
      treatment: create(),
      existingPhotos: first.photos,
      onDate: ON_DATE,
      photo: photo(2),
    });
    expect(second.status).toBe('recorded');
    if (second.status !== 'recorded') {
      return;
    }

    const third = recordPatientPhoto({
      treatment: create(),
      existingPhotos: second.photos,
      onDate: ON_DATE,
      photo: photo(3),
    });
    expect(third.status).toBe('recorded');
    if (third.status !== 'recorded') {
      return;
    }

    expect(countPatientPhotosOnDate(third.photos, ON_DATE)).toBe(3);
    expect(nextPatientPhotoSlot(third.photos, ON_DATE)).toBeNull();
    expect(third.photos.map((item) => item.id)).toEqual([
      'photo-1-19',
      'photo-2-19',
      'photo-3-19',
    ]);
    expect(third.photos.map((item) => item.slot)).toEqual([1, 2, 3]);
  });

  it('refuses a fourth photo on the same civil date', () => {
    const existing: PatientPhoto[] = [photo(1), photo(2), photo(3)];
    expect(
      recordPatientPhoto({
        treatment: create(),
        existingPhotos: existing,
        onDate: ON_DATE,
        photo: photo(1),
      }),
    ).toEqual({ status: 'ignored', reason: 'daily_cap_reached' });
    expect(existing).toHaveLength(3);
  });

  it('allows another civil date independently', () => {
    const existing: PatientPhoto[] = [photo(1), photo(2), photo(3)];
    const result = recordPatientPhoto({
      treatment: create(),
      existingPhotos: existing,
      onDate: OTHER_DATE,
      photo: photo(1, OTHER_DATE),
    });

    expect(result.status).toBe('recorded');
    if (result.status !== 'recorded') {
      return;
    }
    expect(countPatientPhotosOnDate(result.photos, ON_DATE)).toBe(3);
    expect(countPatientPhotosOnDate(result.photos, OTHER_DATE)).toBe(1);
  });

  it('ignores inactive treatment', () => {
    expect(
      recordPatientPhoto({
        treatment: create({ status: 'completed' }),
        existingPhotos: [],
        onDate: ON_DATE,
        photo: photo(1),
      }),
    ).toEqual({ status: 'ignored', reason: 'no_active_treatment' });
  });
});
