import { calendarDate, completionIdFor } from '../domain';

import {
  COMPLETION_OVERLAY_VERSION,
  parseCompletionOverlay,
  serializeCompletionOverlay,
} from './completion-overlay-store';

const TREATMENT_ID = 'treatment-1';
const ON_DATE = calendarDate(2026, 8, 1);
const COMPLETION_ID = completionIdFor('assignment-1', ON_DATE);

describe('serializeCompletionOverlay', () => {
  it('writes only version, treatmentId, and completion overlay fields', () => {
    const raw = serializeCompletionOverlay(TREATMENT_ID, [
      {
        id: COMPLETION_ID,
        assignmentId: 'assignment-1',
        completedOn: ON_DATE,
      },
    ]);

    expect(JSON.parse(raw)).toEqual({
      version: COMPLETION_OVERLAY_VERSION,
      treatmentId: TREATMENT_ID,
      completions: [
        {
          id: COMPLETION_ID,
          assignmentId: 'assignment-1',
          completedOn: { year: 2026, month: 8, day: 1 },
        },
      ],
    });
    expect(raw).not.toContain('assignments');
    expect(raw).not.toContain('periods');
    expect(raw).not.toContain('instruction');
  });
});

describe('parseCompletionOverlay', () => {
  it('returns an empty overlay for missing, invalid, or mismatched payloads', () => {
    expect(parseCompletionOverlay(null, TREATMENT_ID)).toEqual([]);
    expect(parseCompletionOverlay('{', TREATMENT_ID)).toEqual([]);
    expect(parseCompletionOverlay('[]', TREATMENT_ID)).toEqual([]);
    expect(
      parseCompletionOverlay(
        serializeCompletionOverlay('other-treatment', [
          {
            id: COMPLETION_ID,
            assignmentId: 'assignment-1',
            completedOn: ON_DATE,
          },
        ]),
        TREATMENT_ID,
      ),
    ).toEqual([]);
    expect(
      parseCompletionOverlay(
        JSON.stringify({
          version: 2,
          treatmentId: TREATMENT_ID,
          completions: [
            {
              id: COMPLETION_ID,
              assignmentId: 'assignment-1',
              completedOn: ON_DATE,
            },
          ],
        }),
        TREATMENT_ID,
      ),
    ).toEqual([]);
  });

  it('keeps valid rows, reconstructs missing ids, and drops duplicates', () => {
    const raw = JSON.stringify({
      version: COMPLETION_OVERLAY_VERSION,
      treatmentId: TREATMENT_ID,
      completions: [
        {
          assignmentId: 'assignment-1',
          completedOn: { year: 2026, month: 8, day: 1 },
        },
        {
          id: 'custom-id',
          assignmentId: 'assignment-1',
          completedOn: { year: 2026, month: 8, day: 1 },
        },
        {
          assignmentId: 'assignment-2',
          completedOn: { year: 2026, month: 8, day: 2 },
        },
        { assignmentId: '', completedOn: ON_DATE },
        { assignmentId: 'bad-date', completedOn: { year: 2026, month: 13, day: 1 } },
      ],
    });

    expect(parseCompletionOverlay(raw, TREATMENT_ID)).toEqual([
      {
        id: COMPLETION_ID,
        assignmentId: 'assignment-1',
        completedOn: ON_DATE,
      },
      {
        id: completionIdFor('assignment-2', calendarDate(2026, 8, 2)),
        assignmentId: 'assignment-2',
        completedOn: calendarDate(2026, 8, 2),
      },
    ]);
  });
});
