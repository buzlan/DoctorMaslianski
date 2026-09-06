import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { VasScore, Wellbeing } from "@/modules/diary/domain";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import {
  AppText,
  Button,
  Card,
  ChoiceChip,
  ScoreStepper,
  Stack,
} from "@/shared/ui";

const VAS_SCORES: readonly VasScore[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const WELLBEING_CHOICES: readonly {
  value: Wellbeing;
  label: string;
}[] = [
  { value: "better", label: copy.diary.wellbeingBetter },
  { value: "unchanged", label: copy.diary.wellbeingUnchanged },
  { value: "worse", label: copy.diary.wellbeingWorse },
];

type DailyDiaryFormProps = {
  submitting: boolean;
  onSubmit: (answers: {
    pain: VasScore;
    swelling: VasScore;
    wellbeing: Wellbeing;
  }) => void;
};

export function DailyDiaryForm({ submitting, onSubmit }: DailyDiaryFormProps) {
  const [pain, setPain] = useState<VasScore | null>(null);
  const [swelling, setSwelling] = useState<VasScore | null>(null);
  const [wellbeing, setWellbeing] = useState<Wellbeing | null>(null);

  const canSubmit =
    pain !== null && swelling !== null && wellbeing !== null && !submitting;

  return (
    <Stack gap="lg">
      <Card variant="elevated">
        <Stack gap="sm">
          <AppText variant="title">{copy.diary.painLabel}</AppText>
          <ScoreStepper
            label={copy.diary.painLabel}
            scores={VAS_SCORES}
            value={pain}
            onChange={setPain}
            disabled={submitting}
          />
        </Stack>
      </Card>
      <Card variant="elevated">
        <Stack gap="sm">
          <AppText variant="title">{copy.diary.swellingLabel}</AppText>
          <ScoreStepper
            label={copy.diary.swellingLabel}
            scores={VAS_SCORES}
            value={swelling}
            onChange={setSwelling}
            disabled={submitting}
          />
        </Stack>
      </Card>
      <Card variant="elevated">
        <Stack gap="sm">
          <AppText variant="title">{copy.diary.wellbeingLabel}</AppText>
          <View style={styles.wellbeingRow}>
            {WELLBEING_CHOICES.map((choice) => (
              <ChoiceChip
                key={choice.value}
                label={choice.label}
                selected={wellbeing === choice.value}
                disabled={submitting}
                onPress={() => setWellbeing(choice.value)}
              />
            ))}
          </View>
        </Stack>
      </Card>
      <Button
        variant="primary"
        label={copy.diary.submit}
        disabled={!canSubmit}
        onPress={() => {
          if (pain === null || swelling === null || wellbeing === null) {
            return;
          }
          onSubmit({ pain, swelling, wellbeing });
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  wellbeingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
});
