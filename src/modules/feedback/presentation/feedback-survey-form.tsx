import { useState } from "react";

import { copy } from "@/shared/copy";
import { AppText, Button, Card, ScoreStepper, Stack } from "@/shared/ui";

import type { FeedbackScore } from "../domain";

const SCORES: readonly FeedbackScore[] = [1, 2, 3, 4, 5];

type FeedbackSurveyFormProps = {
  submitting: boolean;
  onSubmit: (answers: {
    usefulnessScore: FeedbackScore;
    clarityScore: FeedbackScore;
  }) => void;
};

export function FeedbackSurveyForm({
  submitting,
  onSubmit,
}: FeedbackSurveyFormProps) {
  const [usefulnessScore, setUsefulnessScore] = useState<FeedbackScore | null>(
    null,
  );
  const [clarityScore, setClarityScore] = useState<FeedbackScore | null>(null);

  const canSubmit =
    usefulnessScore !== null && clarityScore !== null && !submitting;

  return (
    <Card variant="elevated">
      <Stack gap="lg">
        <AppText variant="title">{copy.completion.surveyTitle}</AppText>
        <Stack gap="sm">
          <AppText>{copy.completion.usefulnessLabel}</AppText>
          <ScoreStepper
            label={copy.completion.usefulnessLabel}
            scores={SCORES}
            value={usefulnessScore}
            onChange={setUsefulnessScore}
            disabled={submitting}
          />
        </Stack>
        <Stack gap="sm">
          <AppText>{copy.completion.clarityLabel}</AppText>
          <ScoreStepper
            label={copy.completion.clarityLabel}
            scores={SCORES}
            value={clarityScore}
            onChange={setClarityScore}
            disabled={submitting}
          />
        </Stack>
        <Button
          variant="primary"
          label={copy.completion.submit}
          disabled={!canSubmit}
          onPress={() => {
            if (usefulnessScore === null || clarityScore === null) {
              return;
            }
            onSubmit({
              usefulnessScore,
              clarityScore,
            });
          }}
        />
      </Stack>
    </Card>
  );
}
