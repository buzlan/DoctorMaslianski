import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import { getColors, theme } from "@/shared/theme";

import { AppText } from "./app-text";

type ScoreStepperProps<T extends number> = {
  label: string;
  scores: readonly T[];
  value: T | null;
  onChange: (score: T) => void;
  disabled?: boolean;
};

export function ScoreStepper<T extends number>({
  label,
  scores,
  value,
  onChange,
  disabled = false,
}: ScoreStepperProps<T>) {
  const colors = getColors(useColorScheme());

  return (
    <View style={styles.row}>
      {scores.map((score) => {
        const selected = value === score;
        return (
          <Pressable
            key={score}
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${score}`}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(score)}
            style={[
              styles.cell,
              {
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: selected ? colors.accent : colors.surface,
              },
            ]}
          >
            <AppText
              variant="label"
              style={{
                color: selected ? colors.accentOnAccent : colors.textPrimary,
              }}
            >
              {score}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  cell: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: theme.radii.md,
  },
});
