export type DoctorMilestonePhoto = {
  id: string;
  treatmentId: string;
  milestoneId: string;
  storageRef: string;
};

export class InvalidDoctorMilestonePhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDoctorMilestonePhotoError';
  }
}

export type CreateDoctorMilestonePhotoInput = {
  id: string;
  treatmentId: string;
  milestoneId: string;
  storageRef: string;
};

export function createDoctorMilestonePhoto(
  input: CreateDoctorMilestonePhotoInput,
): DoctorMilestonePhoto {
  return {
    id: parseRequiredId(input.id, 'id'),
    treatmentId: parseRequiredId(input.treatmentId, 'treatmentId'),
    milestoneId: parseRequiredId(input.milestoneId, 'milestoneId'),
    storageRef: parseStorageRef(input.storageRef),
  };
}

function parseRequiredId(value: string, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InvalidDoctorMilestonePhotoError(`invalid field: ${field}`);
  }

  return value;
}

function parseStorageRef(value: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InvalidDoctorMilestonePhotoError('invalid field: storageRef');
  }

  if (value.includes('://') || value.includes('..') || value.startsWith('/') || value.includes('\\')) {
    throw new InvalidDoctorMilestonePhotoError('invalid field: storageRef');
  }

  return value;
}
