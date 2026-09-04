import type { PatientPhoto } from '../domain';

import { copyPhoto } from './patient-photo-store-codec';
import type { PatientPhotoStore } from './patient-photo-store';

export function createInMemoryPatientPhotoStore(
  seed: readonly PatientPhoto[] = [],
): PatientPhotoStore {
  const byTreatment = new Map<string, PatientPhoto[]>();
  for (const photo of seed) {
    const existing = byTreatment.get(photo.treatmentId) ?? [];
    existing.push(copyPhoto(photo));
    byTreatment.set(photo.treatmentId, existing);
  }

  return {
    load(treatmentId) {
      return Promise.resolve((byTreatment.get(treatmentId) ?? []).map(copyPhoto));
    },
    save(treatmentId, photos) {
      byTreatment.set(treatmentId, photos.map(copyPhoto));
      return Promise.resolve();
    },
  };
}
