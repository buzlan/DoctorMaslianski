import { createTreatment } from '@/modules/treatment/domain';

import {
  createFeedbackSurvey,
  feedbackSurveyIdFor,
  InvalidFeedbackSurveyError,
} from './create-feedback-survey';

const AT = '2026-08-19T15:00:00.000Z';

describe('createFeedbackSurvey', () => {
  it('creates a product-validation survey with structural 1-5 scores only', () => {
    expect(
      createFeedbackSurvey({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedAt: AT,
        answers: { usefulnessScore: 4, clarityScore: 5 },
      }),
    ).toEqual({
      id: feedbackSurveyIdFor('treatment-1'),
      treatmentId: 'treatment-1',
      patientId: 'patient-1',
      submittedAt: AT,
      usefulnessScore: 4,
      clarityScore: 5,
    });
  });

  it('rejects free text and other unsupported answer fields', () => {
    expect(() =>
      createFeedbackSurvey({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedAt: AT,
        answers: {
          usefulnessScore: 3,
          clarityScore: 2,
          freeText: 'instructions were clear',
        },
      }),
    ).toThrow(InvalidFeedbackSurveyError);
  });

  it('rejects scores outside 1-5', () => {
    expect(() =>
      createFeedbackSurvey({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
        submittedAt: AT,
        answers: { usefulnessScore: 0, clarityScore: 5 },
      }),
    ).toThrow(InvalidFeedbackSurveyError);
  });

  it('does not copy treatment medical fields onto the survey', () => {
    const treatment = createTreatment({
      id: 'treatment-1',
      patientId: 'patient-1',
      status: 'completed',
    });
    const survey = createFeedbackSurvey({
      treatmentId: treatment.id,
      patientId: treatment.patientId,
      submittedAt: AT,
      answers: { usefulnessScore: 1, clarityScore: 1 },
    });

    expect(survey).not.toHaveProperty('status');
    expect(survey).not.toHaveProperty('assignments');
    expect(survey).not.toHaveProperty('protocolVersion');
    expect(survey).not.toHaveProperty('freeText');
  });
});
