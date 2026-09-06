import { createTreatment } from '@/modules/treatment/domain';

import { recordFeedbackSurvey } from './record-feedback-survey';

const AT = '2026-08-19T15:00:00.000Z';
const ANSWERS = { usefulnessScore: 4, clarityScore: 5 };

function completed() {
  return createTreatment({
    id: 'treatment-1',
    patientId: 'patient-1',
    status: 'completed',
  });
}

describe('recordFeedbackSurvey', () => {
  it('records a survey only when treatment is completed', () => {
    const result = recordFeedbackSurvey({
      treatment: completed(),
      existing: null,
      submittedAt: AT,
      answers: ANSWERS,
    });

    expect(result).toEqual({
      status: 'recorded',
      alreadyPresent: false,
      survey: {
        id: 'treatment-1:feedback',
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedAt: AT,
        usefulnessScore: 4,
        clarityScore: 5,
      },
    });
  });

  it('ignores submit when treatment is still active', () => {
    expect(
      recordFeedbackSurvey({
        treatment: createTreatment({
          id: 'treatment-1',
          patientId: 'patient-1',
        }),
        existing: null,
        submittedAt: AT,
        answers: ANSWERS,
      }),
    ).toEqual({ status: 'ignored', reason: 'treatment_not_completed' });
  });

  it('ignores submit when treatment is cancelled', () => {
    expect(
      recordFeedbackSurvey({
        treatment: createTreatment({
          id: 'treatment-1',
          patientId: 'patient-1',
          status: 'cancelled',
        }),
        existing: null,
        submittedAt: AT,
        answers: ANSWERS,
      }),
    ).toEqual({ status: 'ignored', reason: 'treatment_not_completed' });
  });

  it('returns the existing survey without replacing it', () => {
    const first = recordFeedbackSurvey({
      treatment: completed(),
      existing: null,
      submittedAt: AT,
      answers: ANSWERS,
    });
    if (first.status !== 'recorded') {
      throw new Error('expected recorded');
    }

    const second = recordFeedbackSurvey({
      treatment: completed(),
      existing: first.survey,
      submittedAt: '2026-08-20T15:00:00.000Z',
      answers: { usefulnessScore: 1, clarityScore: 1 },
    });

    expect(second).toEqual({
      status: 'recorded',
      alreadyPresent: true,
      survey: first.survey,
    });
  });
});
