import { createFeedbackSurvey, type FeedbackSurvey } from '../domain';

import { parseFeedbackSurvey, serializeFeedbackSurvey } from './feedback-survey-store';

const AT = '2026-08-19T15:00:00.000Z';
const TREATMENT_ID = 'treatment-1';

function survey(): FeedbackSurvey {
  return createFeedbackSurvey({
    treatmentId: TREATMENT_ID,
    patientId: 'patient-1',
    submittedAt: AT,
    answers: {
      usefulnessScore: 4,
      clarityScore: 5,
    },
  });
}

describe('feedback survey store envelope', () => {
  it('round-trips numeric scores only', () => {
    const stored = survey();
    const raw = serializeFeedbackSurvey(TREATMENT_ID, stored);

    expect(parseFeedbackSurvey(raw, TREATMENT_ID)).toEqual(stored);
    expect(raw).not.toContain('freeText');
    expect(raw).not.toContain('protocolKind');
  });

  it('loads scores from a leftover envelope that contained free text and drops the text', () => {
    const stored = survey();
    const raw = JSON.stringify({
      version: 1,
      treatmentId: TREATMENT_ID,
      survey: {
        ...stored,
        freeText: 'understood the daily actions',
      },
    });

    expect(parseFeedbackSurvey(raw, TREATMENT_ID)).toEqual(stored);
  });

  it('returns null for a different treatment id or corrupt payload', () => {
    const raw = serializeFeedbackSurvey(TREATMENT_ID, survey());

    expect(parseFeedbackSurvey(raw, 'other-treatment')).toBeNull();
    expect(parseFeedbackSurvey('{', TREATMENT_ID)).toBeNull();
    expect(parseFeedbackSurvey(null, TREATMENT_ID)).toBeNull();
  });
});
