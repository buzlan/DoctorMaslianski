import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import type { TodayPeriodProgress } from "@/modules/today/application";
import { patientImages } from "@/shared/assets/patient-images";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import { AppText, Card, Stack } from "@/shared/ui";

import { clampAssignmentCounts } from "./assignment-progress-ratio";
import { AssignmentProgressRing } from "./assignment-progress-ring";

type TodayPeriodProgressCardProps = {
  progress: TodayPeriodProgress;
};

export function TodayPeriodProgressCard({
  progress,
}: TodayPeriodProgressCardProps) {
  const { completed, total } = clampAssignmentCounts(
    progress.completedAssignments,
    progress.totalAssignments,
  );

  const dayLabel =
    progress.periodDayNumber !== null
      ? `${copy.today.periodDayLabel} ${progress.periodDayNumber}`
      : null;
  // total === 0 still shows "0 из 0"; ring stays visible with empty arc.
  const countLabel = `${completed} ${copy.today.progressCountOf} ${total}`;
  const hasTitle =
    progress.periodTitle !== undefined && progress.periodTitle.length > 0;

  return (
    <Card variant="tinted" style={styles.card}>
      <View style={styles.row}>
        <AssignmentProgressRing
          completed={completed}
          total={total}
          dayLabel={dayLabel}
          countLabel={countLabel}
        />
        <Stack gap="xs" style={styles.copy}>
          {hasTitle ? (
            <AppText variant="title" style={styles.title} numberOfLines={2}>
              {progress.periodTitle}
            </AppText>
          ) : null}
          <AppText
            variant="body"
            tone="secondary"
            style={styles.support}
            numberOfLines={3}
          >
            {copy.today.progressSupportText}
          </AppText>
        </Stack>
        <Image
          source={patientImages.plantProgress}
          style={styles.plant}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 24,
  },
  support: {
    fontSize: 15,
    lineHeight: 22,
  },
  plant: {
    width: 64,
    height: 72,
    opacity: 0.92,
    marginRight: -theme.spacing.xs,
  },
});
