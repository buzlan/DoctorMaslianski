import { calendarDate } from '@/modules/treatment/domain';

import { createPatientPhoto, InvalidPatientPhotoError } from './create-patient-photo';

const ON_DATE = calendarDate(2026, 8, 19);

describe('createPatientPhoto', () => {
  it('creates a photo with id, treatmentId, patientId, submittedOn, and slot', () => {
    const photo = createPatientPhoto({
      id: 'photo-1',
      treatmentId: 'treatment-1',
      patientId: 'patient-1',
      submittedOn: ON_DATE,
      slot: 1,
    });

    expect(photo).toEqual({
      id: 'photo-1',
      treatmentId: 'treatment-1',
      patientId: 'patient-1',
      submittedOn: ON_DATE,
      slot: 1,
    });
    expect(Object.keys(photo)).toEqual([
      'id',
      'treatmentId',
      'patientId',
      'submittedOn',
      'slot',
    ]);
    expect(photo).not.toHaveProperty('localFileRef');
    expect(photo).not.toHaveProperty('remoteUri');
    expect(photo).not.toHaveProperty('mimeType');
    expect(photo).not.toHaveProperty('diagnosis');
  });

  it('rejects a URL as id', () => {
    expect(() =>
      createPatientPhoto({
        id: 'https://example.test/photo.jpg',
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        slot: 1,
      }),
    ).toThrow(InvalidPatientPhotoError);
  });
});
