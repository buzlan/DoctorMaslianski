export type FeedbackScore = 1 | 2 | 3 | 4 | 5;

export type FeedbackSurvey = {
  id: string;
  treatmentId: string;
  patientId: string;
  submittedAt: string;
  usefulnessScore: FeedbackScore;
  clarityScore: FeedbackScore;
};
