import {
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import type { TodayAssignmentItem } from "@/modules/today/application";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import {
  AppIcon,
  AppText,
  CompletionMark,
  IconWell,
  Stack,
} from "@/shared/ui";

import { resolveAssignmentIcon } from "./resolve-assignment-icon";

export type TodayAssignmentRowProps = {
  assignment: TodayAssignmentItem;
  /** Optional backend/web icon key; mocked from id when omitted. */
  iconKey?: string;
  pending: boolean;
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
  iconKey,
  pending,
  onToggle,
  onOpenDetail,
  showDivider,
}: TodayAssignmentRowProps) {
  const colors = getColors(useColorScheme());
  const iconName = resolveAssignmentIcon({
    assignmentId: assignment.id,
    iconKey,
  });
  const showChevron = onOpenDetail !== undefined;

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
      <View style={styles.row}>
        <CompletionMark
          completed={assignment.completed}
          disabled={pending}
          accessibilityLabel={assignmentLabel(assignment)}
          accessibilityHint={
            assignment.completed
              ? copy.today.markIncomplete
              : copy.today.markComplete
          }
          onPress={() => onToggle(assignment)}
        />
        <IconWell name={iconName} size={44} />
        {showChevron ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={assignmentLabel(assignment)}
            onPress={() => onOpenDetail(assignment)}
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
      </View>
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
