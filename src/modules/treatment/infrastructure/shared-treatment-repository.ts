import { createAsyncStorageCompletionOverlayStore } from './async-storage-completion-overlay-store';
import { createPersistentTreatmentRepository } from './persistent-treatment-repository';

export const sharedTreatmentRepository = createPersistentTreatmentRepository({
  store: createAsyncStorageCompletionOverlayStore(),
});
