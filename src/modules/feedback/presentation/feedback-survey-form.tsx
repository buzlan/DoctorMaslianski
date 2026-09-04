import { useState } from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Button, Stack } from "@/shared/ui";

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
    <Stack gap="lg">
      <AppText variant="caption" tone="secondary">
        {copy.completion.surveyTitle}
      </AppText>
      <ScoreField
        label={copy.completion.usefulnessLabel}
        value={usefulnessScore}
        onChange={setUsefulnessScore}
        disabled={submitting}
      />
      <ScoreField
        label={copy.completion.clarityLabel}
        value={clarityScore}
        onChange={setClarityScore}
        disabled={submitting}
      />
      <Button
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
  );
}

function ScoreField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: FeedbackScore | null;
  onChange: (score: FeedbackScore) => void;
  disabled: boolean;
}) {
  const colors = getColors(useColorScheme());

  return (
    <Stack gap="sm">
      <AppText>{label}</AppText>
      <View style={styles.scoreRow}>
        {SCORES.map((score) => {
          const selected = value === score;
          return (
            <Pressable
              key={score}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${score}`}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(score)}
              style={[styles.scoreCell, { borderColor: colors.textSecondary }]}
            >
              <AppText
                style={{
                  color: selected ? colors.accent : colors.textPrimary,
                }}
              >
                {score}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Stack>
  );
}

const styles = StyleSheet.create({
  scoreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  scoreCell: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radii.sm,
  },
});
