import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import type { TodayAssignmentItem } from "@/modules/today/application";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppIcon, AppText, CompletionMark, Stack } from "@/shared/ui";

import { CatalogAssignmentIcon } from "./catalog-assignment-icon";


export type TodayAssignmentRowProps = {
  assignment: TodayAssignmentItem;
  onToggle: (assignment: TodayAssignmentItem) => void;
  /** When set, shows a chevron and opens detail. Omit until detail exists. */
  onOpenDetail?: (assignment: TodayAssignmentItem) => void;
  showDivider: boolean;
};

function assignmentLabel(assignment: TodayAssignmentItem): string {
  if (assignment.title !== undefined && assignment.title.length > 0) {
    return assignment.title;
  }
  return copy.today.tasksLabel;
}

export function TodayAssignmentRow({
  assignment,
  onToggle,
  onOpenDetail,
  showDivider,
}: TodayAssignmentRowProps) {
  const colors = getColors(useColorScheme());
  const openDetail = onOpenDetail;

  const textColumn = (
    <Stack gap="xs" style={styles.copy}>
      {assignment.title ? (
        <AppText variant="body" style={styles.title}>
          {assignment.title}
        </AppText>
      ) : null}
      {assignment.instruction ? (
        <AppText variant="caption" tone="secondary">
          {assignment.instruction}
        </AppText>
      ) : null}
      {assignment.completed ? (
        <AppText variant="label" style={{ color: colors.accent }}>
          {copy.today.completed}
        </AppText>
      ) : null}
    </Stack>
  );

  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={assignmentLabel(assignment)}
        accessibilityHint={
          assignment.completed
            ? copy.today.markIncomplete
            : copy.today.markComplete
        }
        accessibilityState={{ checked: assignment.completed }}
        onPress={() => onToggle(assignment)}
        style={({ pressed }) => [
          styles.row,
          pressed ? { backgroundColor: colors.accentSoft } : null,
        ]}
      >
        <CompletionMark completed={assignment.completed} />
        <CatalogAssignmentIcon path={assignment.iconStoragePath} />
        {openDetail !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={assignmentLabel(assignment)}
            onPress={() => openDetail(assignment)}
            style={({ pressed }) => [
              styles.detailHit,
              { opacity: pressed ? 0.84 : 1 },
            ]}
          >
            {textColumn}
            <AppIcon
              name="chevron-right"
              color={colors.textSecondary}
              size={16}
            />
          </Pressable>
        ) : (
          textColumn
        )}
      </Pressable>
      {showDivider ? (
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: -theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
  },
  detailHit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44 + theme.spacing.sm + 44 + theme.spacing.sm,
  },
});
