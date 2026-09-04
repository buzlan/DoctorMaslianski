import { createPersistentDiaryRepository } from './persistent-diary-repository';
import { createSecureStoreDiaryEntryStore } from './secure-store-diary-entry-store';

export const sharedDiaryRepository = createPersistentDiaryRepository({
  store: createSecureStoreDiaryEntryStore(),
});
