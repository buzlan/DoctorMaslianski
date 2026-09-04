import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";

import {
  sharedDiaryLoader,
  type DiaryHistoryItem,
  type DiaryTodayResult,
} from "@/modules/diary/application";
import type { VasScore, Wellbeing } from "@/modules/diary/domain";
import { copy } from "@/shared/copy";
import { toLocalCalendarDate } from "@/shared/date/to-local-calendar-date";
import { getColors, theme } from "@/shared/theme";
import { AppText, Screen, Stack } from "@/shared/ui";

import { DailyDiaryForm } from "./daily-diary-form";
import { DiaryHistoryList } from "./diary-history-list";

type DiaryViewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "no_active_treatment" }
  | { status: "open"; history: readonly DiaryHistoryItem[] }
  | { status: "completed"; history: readonly DiaryHistoryItem[] };

function toViewState(result: DiaryTodayResult): DiaryViewState {
  if (result.status === "open" || result.status === "completed") {
    return { status: result.status, history: result.history };
  }
  return result;
}

function todayDate() {
  return toLocalCalendarDate(new Date());
}

export function DiaryScreen() {
  const colors = getColors(useColorScheme());
  const [viewState, setViewState] = useState<DiaryViewState>({
    status: "loading",
  });
  const [submitting, setSubmitting] = useState(false);
  const loadGenerationRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const generation = loadGenerationRef.current + 1;
      loadGenerationRef.current = generation;

      void sharedDiaryLoader.load(todayDate()).then((result) => {
        if (loadGenerationRef.current === generation) {
          setViewState(toViewState(result));
        }
      });
    }, []),
  );

  function submit(answers: {
    pain: VasScore;
    swelling: VasScore;
    wellbeing: Wellbeing;
  }) {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    setSubmitting(true);

    void sharedDiaryLoader
      .submit(todayDate(), answers)
      .then((result) => {
        if (loadGenerationRef.current === generation) {
          setViewState(toViewState(result));
        }
      })
      .finally(() => {
        if (loadGenerationRef.current === generation) {
          setSubmitting(false);
        }
      });
  }

  const showHistory =
    viewState.status === "open" || viewState.status === "completed";

  return (
    <Screen edges={["top", "left", "right"]} style={styles.content}>
      <Stack gap="md" style={styles.body}>
        <AppText variant="title">{copy.diary.title}</AppText>
        {viewState.status === "loading" ? (
          <AppText tone="secondary">{copy.diary.loading}</AppText>
        ) : null}
        {viewState.status === "no_active_treatment" ? (
          <AppText tone="secondary">{copy.diary.noActiveTreatment}</AppText>
        ) : null}
        {viewState.status === "error" ? (
          <Stack gap="md">
            <AppText tone="secondary">{copy.diary.loadError}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.diary.retry}
              onPress={() => {
                const generation = loadGenerationRef.current + 1;
                loadGenerationRef.current = generation;
                setViewState({ status: "loading" });
                void sharedDiaryLoader.load(todayDate()).then((result) => {
                  if (loadGenerationRef.current === generation) {
                    setViewState(toViewState(result));
                  }
                });
              }}
            >
              <AppText style={{ color: colors.accent }}>
                {copy.diary.retry}
              </AppText>
            </Pressable>
          </Stack>
        ) : null}
        {viewState.status === "completed" ? (
          <AppText tone="secondary">{copy.diary.completedToday}</AppText>
        ) : null}
        {showHistory ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <Stack gap="md">
              {viewState.status === "open" ? (
                <DailyDiaryForm submitting={submitting} onSubmit={submit} />
              ) : null}
              <DiaryHistoryList items={viewState.history} />
            </Stack>
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
    paddingBottom: theme.spacing.lg,
  },
});
