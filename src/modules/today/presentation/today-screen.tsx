import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";

import {
  sharedTodayLoader,
  toLocalCalendarDate,
  type TodayLoadResult,
  type TodayOverview,
} from "@/modules/today/application";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Screen, Stack } from "@/shared/ui";

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

function requestTodayLoad() {
  return sharedTodayLoader.load(toLocalCalendarDate(new Date()));
}

function ReadyContent({ overview }: { overview: ReadyOverview }) {
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
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function TodayScreen() {
  const colors = getColors(useColorScheme());
  const [viewState, setViewState] = useState<TodayViewState>({
    status: "loading",
  });
  const loadGenerationRef = useRef(0);

  useEffect(() => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    void requestTodayLoad().then((result) => {
      if (loadGenerationRef.current === generation) {
        setViewState(toViewState(result));
      }
    });
  }, []);

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
            <ReadyContent overview={viewState.overview} />
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
