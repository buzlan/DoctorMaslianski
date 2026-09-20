import { createDoctorMilestonePhoto } from './create-doctor-milestone-photo';
import { doctorPhotosForMilestone } from './doctor-milestone-photo-helpers';

const visitPhoto = createDoctorMilestonePhoto({
  id: 'photo-1',
  treatmentId: 'treatment-1',
  milestoneId: 'visit-1',
  storageRef: 'visit-1-photo-1.jpg',
});

describe('doctorPhotosForMilestone', () => {
  it('returns photos for the matching treatment and milestone only', () => {
    expect(
      doctorPhotosForMilestone(
        [
          visitPhoto,
          createDoctorMilestonePhoto({
            id: 'photo-2',
            treatmentId: 'treatment-1',
            milestoneId: 'visit-2',
            storageRef: 'visit-2-photo-1.jpg',
          }),
          createDoctorMilestonePhoto({
            id: 'photo-3',
            treatmentId: 'treatment-2',
            milestoneId: 'visit-1',
            storageRef: 'other-treatment.jpg',
          }),
        ],
        'treatment-1',
        'visit-1',
      ),
    ).toEqual([visitPhoto]);
  });
});
