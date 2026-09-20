import { getRemoteAdapters } from '@/core/runtime/remote-adapters';
import { shouldUseRemoteRepositories } from '@/core/runtime/should-use-remote-repositories';

import { createAsyncStorageCompletionOverlayStore } from './async-storage-completion-overlay-store';
import { createPersistentTreatmentRepository } from './persistent-treatment-repository';
import type { TreatmentRepository } from './treatment-repository';

const localTreatmentRepository = createPersistentTreatmentRepository({
  store: createAsyncStorageCompletionOverlayStore(),
});

function activeTreatmentRepository(): TreatmentRepository {
  if (shouldUseRemoteRepositories()) {
    const remote = getRemoteAdapters();
    if (remote !== null) {
      return remote.treatment;
    }
  }

  return localTreatmentRepository;
}

export const sharedTreatmentRepository: TreatmentRepository = {
  getActiveTreatment() {
    return activeTreatmentRepository().getActiveTreatment();
  },
  completeAssignment(assignmentId, onDate) {
    return activeTreatmentRepository().completeAssignment(assignmentId, onDate);
  },
  uncompleteAssignment(assignmentId, onDate) {
    return activeTreatmentRepository().uncompleteAssignment(assignmentId, onDate);
  },
};
