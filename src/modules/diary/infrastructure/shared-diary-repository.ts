import { getRemoteAdapters } from '@/core/runtime/remote-adapters';
import { shouldUseRemoteRepositories } from '@/core/runtime/should-use-remote-repositories';

import { createPersistentDiaryRepository } from './persistent-diary-repository';
import { createSecureStoreDiaryEntryStore } from './secure-store-diary-entry-store';
import type { DiaryRepository } from './diary-repository';

const localDiaryRepository = createPersistentDiaryRepository({
  store: createSecureStoreDiaryEntryStore(),
});

function activeDiaryRepository(): DiaryRepository {
  if (shouldUseRemoteRepositories()) {
    const remote = getRemoteAdapters();
    if (remote !== null) {
      return remote.diary;
    }
  }

  return localDiaryRepository;
}

export const sharedDiaryRepository: DiaryRepository = {
  listEntries(treatmentId) {
    return activeDiaryRepository().listEntries(treatmentId);
  },
  getEntryOnDate(treatmentId, onDate) {
    return activeDiaryRepository().getEntryOnDate(treatmentId, onDate);
  },
  submitEntry(treatment, onDate, answers) {
    return activeDiaryRepository().submitEntry(treatment, onDate, answers);
  },
};
