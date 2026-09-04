import { createTreatment } from '@/modules/treatment/domain';

import { createInMemoryFeedbackSurveyStore } from './in-memory-feedback-survey-store';
import { createPersistentFeedbackSurveyRepository } from './persistent-feedback-survey-repository';

const TREATMENT_ID = 'treatment-1';
const AT = '2026-08-19T15:00:00.000Z';
const ANSWERS = { usefulnessScore: 4, clarityScore: 5 };

function completed() {
  return createTreatment({
    id: TREATMENT_ID,
    patientId: 'patient-1',
    status: 'completed',
  });
}

describe('createPersistentFeedbackSurveyRepository', () => {
  it('reloads a submitted survey into a new repository instance from the same store', async () => {
    const store = createInMemoryFeedbackSurveyStore();
    const repository = createPersistentFeedbackSurveyRepository({ store });

    const result = await repository.submitSurvey(completed(), AT, ANSWERS);

    expect(result).toMatchObject({
      status: 'recorded',
      alreadyPresent: false,
      survey: {
        treatmentId: TREATMENT_ID,
        usefulnessScore: 4,
        clarityScore: 5,
      },
    });

    const restarted = createPersistentFeedbackSurveyRepository({ store });
    expect(await restarted.getSurvey(TREATMENT_ID)).toEqual(
      result.status === 'recorded' ? result.survey : null,
    );
  });

  it('does not replace an already stored survey', async () => {
    const store = createInMemoryFeedbackSurveyStore();
    const repository = createPersistentFeedbackSurveyRepository({ store });

    await repository.submitSurvey(completed(), AT, ANSWERS);
    const second = await repository.submitSurvey(completed(), '2026-08-20T15:00:00.000Z', {
      usefulnessScore: 1,
      clarityScore: 1,
    });

    expect(second).toMatchObject({ status: 'recorded', alreadyPresent: true });
    if (second.status === 'recorded') {
      expect(second.survey.usefulnessScore).toBe(4);
      expect(second.survey.clarityScore).toBe(5);
      expect(second.survey).not.toHaveProperty('freeText');
    }
  });

  it('ignores submit when treatment is not completed', async () => {
    const repository = createPersistentFeedbackSurveyRepository({
      store: createInMemoryFeedbackSurveyStore(),
    });

    await expect(
      repository.submitSurvey(
        createTreatment({ id: TREATMENT_ID, patientId: 'patient-1' }),
        AT,
        ANSWERS,
      ),
    ).resolves.toEqual({ status: 'ignored', reason: 'treatment_not_completed' });
  });
});
