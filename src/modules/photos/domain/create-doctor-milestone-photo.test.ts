import {
  createDoctorMilestonePhoto,
  InvalidDoctorMilestonePhotoError,
} from './create-doctor-milestone-photo';

describe('createDoctorMilestonePhoto', () => {
  it('creates a photo with only id, treatmentId, milestoneId, and storageRef', () => {
    const photo = createDoctorMilestonePhoto({
      id: 'photo-1',
      treatmentId: 'treatment-1',
      milestoneId: 'visit-1',
      storageRef: 'visit-1-photo-1.jpg',
    });

    expect(photo).toEqual({
      id: 'photo-1',
      treatmentId: 'treatment-1',
      milestoneId: 'visit-1',
      storageRef: 'visit-1-photo-1.jpg',
    });
    expect(Object.keys(photo)).toEqual(['id', 'treatmentId', 'milestoneId', 'storageRef']);
    expect(photo).not.toHaveProperty('remoteUri');
    expect(photo).not.toHaveProperty('displayUri');
    expect(photo).not.toHaveProperty('caption');
    expect(photo).not.toHaveProperty('diagnosis');
    expect(photo).not.toHaveProperty('patientId');
    expect(photo).not.toHaveProperty('localFileRef');
  });

  it('rejects a URL as storageRef', () => {
    expect(() =>
      createDoctorMilestonePhoto({
        id: 'photo-1',
        treatmentId: 'treatment-1',
        milestoneId: 'visit-1',
        storageRef: 'https://example.test/photo.jpg',
      }),
    ).toThrow(InvalidDoctorMilestonePhotoError);
  });

  it('rejects a file URI as storageRef', () => {
    expect(() =>
      createDoctorMilestonePhoto({
        id: 'photo-1',
        treatmentId: 'treatment-1',
        milestoneId: 'visit-1',
        storageRef: 'file:///cache/photo.jpg',
      }),
    ).toThrow(InvalidDoctorMilestonePhotoError);
  });
});
