import { calendarDate } from '@/modules/treatment/domain';

import { createDiaryEntry } from '../domain';

import {
  buildDiaryHistory,
  type DiaryHistoryItem,
} from './build-diary-history';

const EARLIER = calendarDate(2026, 8, 18);
const TODAY = calendarDate(2026, 8, 19);
const LATER = calendarDate(2026, 8, 20);

const HISTORY_ITEM_KEYS = ['id', 'submittedOn', 'pain', 'swelling', 'wellbeing'];

const FORBIDDEN_FIELDS = [
  'trend',
  'delta',
  'threshold',
  'risk',
  'diagnosis',
  'interpretation',
  'recommendation',
  'severity',
  'treatmentId',
  'patientId',
] as const;

function entry(onDate: typeof TODAY, pain: number, wellbeing: 'better' | 'unchanged' | 'worse') {
  return createDiaryEntry({
    treatmentId: 'treatment-1',
    patientId: 'patient-1',
    submittedOn: onDate,
    answers: { pain, swelling: 4, wellbeing },
  });
}

function expectExactHistoryItemShape(item: DiaryHistoryItem) {
  expect(Object.keys(item)).toEqual(HISTORY_ITEM_KEYS);
  for (const field of FORBIDDEN_FIELDS) {
    expect(item).not.toHaveProperty(field);
  }
}

describe('buildDiaryHistory', () => {
  it('maps only id, submittedOn, pain, swelling, and wellbeing', () => {
    const history = buildDiaryHistory([entry(TODAY, 3, 'unchanged')]);

    expect(history).toEqual([
      {
        id: 'treatment-1:2026-8-19',
        submittedOn: TODAY,
        pain: 3,
        swelling: 4,
        wellbeing: 'unchanged',
      },
    ]);
    expectExactHistoryItemShape(history[0]!);
  });

  it('returns newest-first civil-date order without changing input order', () => {
    const oldestFirst = [entry(EARLIER, 1, 'better'), entry(TODAY, 2, 'unchanged'), entry(LATER, 3, 'worse')];

    expect(buildDiaryHistory(oldestFirst)).toEqual([
      {
        id: 'treatment-1:2026-8-20',
        submittedOn: LATER,
        pain: 3,
        swelling: 4,
        wellbeing: 'worse',
      },
      {
        id: 'treatment-1:2026-8-19',
        submittedOn: TODAY,
        pain: 2,
        swelling: 4,
        wellbeing: 'unchanged',
      },
      {
        id: 'treatment-1:2026-8-18',
        submittedOn: EARLIER,
        pain: 1,
        swelling: 4,
        wellbeing: 'better',
      },
    ]);
  });

  it('omits the excluded civil date so an open today does not echo a same-day row', () => {
    expect(
      buildDiaryHistory([entry(EARLIER, 1, 'better'), entry(TODAY, 2, 'unchanged')], {
        excludeDate: TODAY,
      }),
    ).toEqual([
      {
        id: 'treatment-1:2026-8-18',
        submittedOn: EARLIER,
        pain: 1,
        swelling: 4,
        wellbeing: 'better',
      },
    ]);
  });

  it('returns an empty list when there are no entries', () => {
    expect(buildDiaryHistory([])).toEqual([]);
    expect(buildDiaryHistory([entry(TODAY, 2, 'unchanged')], { excludeDate: TODAY })).toEqual([]);
  });
});
