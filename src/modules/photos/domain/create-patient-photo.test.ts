import { calendarDate } from '@/modules/treatment/domain';

import {
  createPatientPhoto,
  InvalidPatientPhotoError,
  patientPhotoIdFor,
} from './create-patient-photo';

const ON_DATE = calendarDate(2026, 8, 19);

describe('createPatientPhoto', () => {
  it('creates a photo with only id, treatmentId, patientId, submittedOn, and localFileRef', () => {
    const photo = createPatientPhoto({
      treatmentId: 'treatment-1',
      patientId: 'patient-1',
      submittedOn: ON_DATE,
      slot: 1,
      localFileRef: 'photo.png',
    });

    expect(photo).toEqual({
      id: patientPhotoIdFor('treatment-1', ON_DATE, 1),
      treatmentId: 'treatment-1',
      patientId: 'patient-1',
      submittedOn: ON_DATE,
      localFileRef: 'photo.png',
    });
    expect(Object.keys(photo)).toEqual([
      'id',
      'treatmentId',
      'patientId',
      'submittedOn',
      'localFileRef',
    ]);
    expect(photo).not.toHaveProperty('remoteUri');
    expect(photo).not.toHaveProperty('mimeType');
    expect(photo).not.toHaveProperty('diagnosis');
  });

  it('rejects a picker cache URI as localFileRef', () => {
    expect(() =>
      createPatientPhoto({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedOn: ON_DATE,
        slot: 1,
        localFileRef: 'file:///cache/photo.jpg',
      }),
    ).toThrow(InvalidPatientPhotoError);
  });
});
