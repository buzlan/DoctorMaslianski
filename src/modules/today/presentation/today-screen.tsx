import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";

import {
  sharedTodayLoader,
  toLocalCalendarDate,
  type TodayAssignmentItem,
  type TodayLoadResult,
  type TodayOverview,
} from "@/modules/today/application";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Button, Screen, Stack } from "@/shared/ui";

type ReadyOverview = Extract<TodayOverview, { kind: "ready" }>;

type TodayViewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "no_active_treatment" }
  | { status: "ready"; overview: ReadyOverview };

function toViewState(result: TodayLoadResult): TodayViewState {
  if (result.status === "ready") {
    return { status: "ready", overview: result.overview };
  }

  return result;
}

function todayDate() {
  return toLocalCalendarDate(new Date());
}

function requestTodayLoad() {
  return sharedTodayLoader.load(todayDate());
}

function ReadyContent({
  overview,
  pendingAssignmentId,
  onToggle,
  onFillDiary,
}: {
  overview: ReadyOverview;
  pendingAssignmentId: string | null;
  onToggle: (assignment: TodayAssignmentItem) => void;
  onFillDiary: () => void;
}) {
  const hasAssignments = overview.assignments.length > 0;

  return (
    <Stack gap="md">
      {overview.periodDayNumber !== null ? (
        <AppText>
          {copy.today.periodDayLabel} {overview.periodDayNumber}
        </AppText>
      ) : null}
      {!hasAssignments ? (
        <AppText tone="secondary">{copy.today.noActionsForToday}</AppText>
      ) : (
        <Stack gap="sm">
          <AppText variant="caption" tone="secondary">
            {copy.today.tasksLabel}
          </AppText>
          {overview.assignments.map((assignment) => (
            <Stack key={assignment.id} gap="xs">
              {assignment.title ? <AppText>{assignment.title}</AppText> : null}
              {assignment.instruction ? (
                <AppText tone="secondary">{assignment.instruction}</AppText>
              ) : null}
              <Button
                label={
                  assignment.completed
                    ? copy.today.markIncomplete
                    : copy.today.markComplete
                }
                disabled={pendingAssignmentId !== null}
                onPress={() => onToggle(assignment)}
              />
            </Stack>
          ))}
        </Stack>
      )}
      {overview.diaryOpen ? (
        <Button label={copy.today.fillDiary} onPress={onFillDiary} />
      ) : null}
    </Stack>
  );
}

export function TodayScreen() {
  const colors = getColors(useColorScheme());
  const router = useRouter();
  const [viewState, setViewState] = useState<TodayViewState>({
    status: "loading",
  });
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(
    null,
  );
  const loadGenerationRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const generation = loadGenerationRef.current + 1;
      loadGenerationRef.current = generation;

      void requestTodayLoad().then((result) => {
        if (loadGenerationRef.current === generation) {
          setViewState(toViewState(result));
        }
      });
    }, []),
  );

  function toggleAssignment(assignment: TodayAssignmentItem) {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    setPendingAssignmentId(assignment.id);

    const request = assignment.completed
      ? sharedTodayLoader.uncompleteAssignment(assignment.id, todayDate())
      : sharedTodayLoader.completeAssignment(assignment.id, todayDate());

    void request
      .then((result) => {
        if (loadGenerationRef.current === generation) {
          setViewState(toViewState(result));
        }
      })
      .finally(() => {
        if (loadGenerationRef.current === generation) {
          setPendingAssignmentId(null);
        }
      });
  }

  return (
    <Screen edges={["top", "left", "right"]} style={styles.content}>
      <Stack gap="md" style={styles.body}>
        <AppText variant="title">{copy.today.title}</AppText>
        {viewState.status === "loading" ? (
          <AppText tone="secondary">{copy.today.loading}</AppText>
        ) : null}
        {viewState.status === "no_active_treatment" ? (
          <AppText tone="secondary">{copy.today.noActiveTreatment}</AppText>
        ) : null}
        {viewState.status === "error" ? (
          <Stack gap="md">
            <AppText tone="secondary">{copy.today.loadError}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.today.retry}
              onPress={() => {
                const generation = loadGenerationRef.current + 1;
                loadGenerationRef.current = generation;
                setViewState({ status: "loading" });
                void requestTodayLoad().then((result) => {
                  if (loadGenerationRef.current === generation) {
                    setViewState(toViewState(result));
                  }
                });
              }}
            >
              <AppText style={{ color: colors.accent }}>
                {copy.today.retry}
              </AppText>
            </Pressable>
          </Stack>
        ) : null}
        {viewState.status === "ready" ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <ReadyContent
              overview={viewState.overview}
              pendingAssignmentId={pendingAssignmentId}
              onToggle={toggleAssignment}
              onFillDiary={() => {
                router.navigate("/diary");
              }}
            />
          </ScrollView>
        ) : null}
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
