import { useState } from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import type { VasScore, Wellbeing } from "@/modules/diary/domain";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Button, Stack } from "@/shared/ui";

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
      <VasField
        label={copy.diary.painLabel}
        value={pain}
        onChange={setPain}
        disabled={submitting}
      />
      <VasField
        label={copy.diary.swellingLabel}
        value={swelling}
        onChange={setSwelling}
        disabled={submitting}
      />
      <Stack gap="sm">
        <AppText>{copy.diary.wellbeingLabel}</AppText>
        {WELLBEING_CHOICES.map((choice) => (
          <WellbeingChoice
            key={choice.value}
            label={choice.label}
            selected={wellbeing === choice.value}
            disabled={submitting}
            onPress={() => setWellbeing(choice.value)}
          />
        ))}
      </Stack>
      <Button
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

function VasField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: VasScore | null;
  onChange: (score: VasScore) => void;
  disabled: boolean;
}) {
  const colors = getColors(useColorScheme());

  return (
    <Stack gap="sm">
      <AppText>{label}</AppText>
      <View style={styles.vasGrid}>
        {VAS_SCORES.map((score) => {
          const selected = value === score;
          return (
            <Pressable
              key={score}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${score}`}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(score)}
              style={[styles.vasCell, { borderColor: colors.textSecondary }]}
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

function WellbeingChoice({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = getColors(useColorScheme());

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.wellbeingChoice}
    >
      <AppText style={{ color: selected ? colors.accent : colors.textPrimary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  vasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  vasCell: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radii.sm,
  },
  wellbeingChoice: {
    minHeight: 44,
    justifyContent: "center",
  },
});
