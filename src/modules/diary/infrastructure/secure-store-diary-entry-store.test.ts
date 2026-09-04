import { calendarDate } from '@/modules/treatment/domain';

import { createDiaryEntry } from '../domain';

import {
  diaryEntryStorageKey,
  diaryIndexStorageKey,
  parseDiaryIndex,
} from './diary-entry-store';
import { createSecureStoreDiaryEntryStore, type SecureStoreLike } from './secure-store-diary-entry-store';

const TREATMENT_ID = 'treatment-1';
const ON_DATE = calendarDate(2026, 8, 19);
const OTHER_DATE = calendarDate(2026, 8, 20);

function entry(onDate = ON_DATE, pain = 2) {
  return createDiaryEntry({
    treatmentId: TREATMENT_ID,
    patientId: 'patient-1',
    submittedOn: onDate,
    answers: { pain, swelling: 1, wellbeing: 'better' },
  });
}

function createMemorySecureStore(): SecureStoreLike & { snapshot(): Record<string, string> } {
  const items = new Map<string, string>();
  return {
    async getItemAsync(key) {
      return items.get(key) ?? null;
    },
    async setItemAsync(key, value) {
      items.set(key, value);
    },
    async deleteItemAsync(key) {
      items.delete(key);
    },
    snapshot() {
      return Object.fromEntries(items.entries());
    },
  };
}

describe('createSecureStoreDiaryEntryStore', () => {
  it('persists one entry per key plus a compact date index', async () => {
    const memory = createMemorySecureStore();
    const store = createSecureStoreDiaryEntryStore(memory);
    const first = entry(ON_DATE, 2);
    const second = entry(OTHER_DATE, 4);

    await store.save(TREATMENT_ID, [first, second]);

    const keys = Object.keys(memory.snapshot()).sort();
    expect(keys).toEqual([
      diaryEntryStorageKey(TREATMENT_ID, ON_DATE),
      diaryEntryStorageKey(TREATMENT_ID, OTHER_DATE),
      diaryIndexStorageKey(TREATMENT_ID),
    ]);
    expect(parseDiaryIndex(memory.snapshot()[diaryIndexStorageKey(TREATMENT_ID)] ?? null, TREATMENT_ID)).toEqual([
      '20260819',
      '20260820',
    ]);
    expect(memory.snapshot()[diaryIndexStorageKey(TREATMENT_ID)]).not.toContain('pain');

    const loaded = await store.load(TREATMENT_ID);
    expect(loaded).toEqual([first, second]);
  });

  it('deletes stale entry keys when a date leaves the saved list', async () => {
    const memory = createMemorySecureStore();
    const store = createSecureStoreDiaryEntryStore(memory);
    await store.save(TREATMENT_ID, [entry(ON_DATE), entry(OTHER_DATE)]);
    await store.save(TREATMENT_ID, [entry(OTHER_DATE, 7)]);

    expect(memory.snapshot()[diaryEntryStorageKey(TREATMENT_ID, ON_DATE)]).toBeUndefined();
    expect(await store.load(TREATMENT_ID)).toEqual([entry(OTHER_DATE, 7)]);
  });

  it('skips a corrupt entry and still returns valid rows', async () => {
    const memory = createMemorySecureStore();
    const store = createSecureStoreDiaryEntryStore(memory);
    await store.save(TREATMENT_ID, [entry(ON_DATE), entry(OTHER_DATE)]);
    await memory.setItemAsync(diaryEntryStorageKey(TREATMENT_ID, ON_DATE), '{');

    expect(await store.load(TREATMENT_ID)).toEqual([entry(OTHER_DATE)]);
  });
});
