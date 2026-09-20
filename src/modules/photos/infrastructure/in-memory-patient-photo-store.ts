import { copyStoredPhoto } from './patient-photo-store-codec';
import type { PatientPhotoStore, StoredPatientPhoto } from './patient-photo-store';

export function createInMemoryPatientPhotoStore(
  seed: readonly StoredPatientPhoto[] = [],
): PatientPhotoStore {
  const byTreatment = new Map<string, StoredPatientPhoto[]>();
  for (const photo of seed) {
    const existing = byTreatment.get(photo.treatmentId) ?? [];
    existing.push(copyStoredPhoto(photo));
    byTreatment.set(photo.treatmentId, existing);
  }

  return {
    load(treatmentId) {
      return Promise.resolve((byTreatment.get(treatmentId) ?? []).map(copyStoredPhoto));
    },
    save(treatmentId, photos) {
      byTreatment.set(treatmentId, photos.map(copyStoredPhoto));
      return Promise.resolve();
    },
  };
}
