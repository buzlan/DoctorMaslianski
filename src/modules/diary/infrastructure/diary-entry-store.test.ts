import { calendarDate } from '@/modules/treatment/domain';

import { createDiaryEntry, diaryEntryIdFor } from '../domain';

import {
  compactCivilDate,
  diaryEntryStorageKey,
  diaryIndexStorageKey,
  parseDiaryEntryEnvelope,
  parseDiaryIndex,
  serializeDiaryEntryEnvelope,
  serializeDiaryIndex,
} from './diary-entry-store';

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

describe('compactCivilDate', () => {
  it('pads month and day', () => {
    expect(compactCivilDate(ON_DATE)).toBe('20260819');
    expect(compactCivilDate(calendarDate(2026, 1, 5))).toBe('20260105');
  });
});

describe('storage keys', () => {
  it('uses one index key and one entry key per civil date', () => {
    expect(diaryIndexStorageKey(TREATMENT_ID)).toBe('diary.v1.index.treatment-1');
    expect(diaryEntryStorageKey(TREATMENT_ID, ON_DATE)).toBe(
      'diary.v1.entry.treatment-1.20260819',
    );
  });

  it('sanitizes unsupported treatment id characters', () => {
    expect(diaryIndexStorageKey('treat:ment/1')).toBe('diary.v1.index.treat_ment_1');
  });
});

describe('serializeDiaryIndex', () => {
  it('writes compact YYYYMMDD dates without answer payloads', () => {
    const raw = serializeDiaryIndex(TREATMENT_ID, [entry(OTHER_DATE, 9), entry(ON_DATE, 2)]);
    expect(JSON.parse(raw)).toEqual({
      version: 1,
      treatmentId: TREATMENT_ID,
      dates: ['20260819', '20260820'],
    });
    expect(raw).not.toContain('pain');
    expect(raw).not.toContain('swelling');
    expect(raw).not.toContain('wellbeing');
    expect(raw).not.toContain('better');
  });
});

describe('parseDiaryIndex', () => {
  it('returns empty for missing, invalid, or mismatched payloads', () => {
    expect(parseDiaryIndex(null, TREATMENT_ID)).toEqual([]);
    expect(parseDiaryIndex('{', TREATMENT_ID)).toEqual([]);
    expect(parseDiaryIndex(serializeDiaryIndex('other', [entry()]), TREATMENT_ID)).toEqual([]);
    expect(
      parseDiaryIndex(
        JSON.stringify({ version: 2, treatmentId: TREATMENT_ID, dates: ['20260819'] }),
        TREATMENT_ID,
      ),
    ).toEqual([]);
  });

  it('drops invalid dates and duplicates', () => {
    expect(
      parseDiaryIndex(
        JSON.stringify({
          version: 1,
          treatmentId: TREATMENT_ID,
          dates: ['20260819', 'not-a-date', '20260819', '20261340'],
        }),
        TREATMENT_ID,
      ),
    ).toEqual(['20260819']);
  });
});

describe('diary entry envelope', () => {
  it('round-trips a validated entry and rejects clinical extras on parse via createDiaryEntry', () => {
    const stored = entry();
    const raw = serializeDiaryEntryEnvelope(TREATMENT_ID, stored);
    expect(parseDiaryEntryEnvelope(raw, TREATMENT_ID)).toEqual(stored);
    expect(parseDiaryEntryEnvelope(raw, TREATMENT_ID)?.id).toBe(
      diaryEntryIdFor(TREATMENT_ID, ON_DATE),
    );
  });

  it('returns null for missing, mismatched, or invalid payloads', () => {
    expect(parseDiaryEntryEnvelope(null, TREATMENT_ID)).toBeNull();
    expect(parseDiaryEntryEnvelope('{', TREATMENT_ID)).toBeNull();
    expect(parseDiaryEntryEnvelope(serializeDiaryEntryEnvelope('other', entry()), TREATMENT_ID)).toBeNull();
    expect(
      parseDiaryEntryEnvelope(
        JSON.stringify({
          version: 1,
          treatmentId: TREATMENT_ID,
          entry: {
            ...entry(),
            pain: 99,
          },
        }),
        TREATMENT_ID,
      ),
    ).toBeNull();
  });
});
