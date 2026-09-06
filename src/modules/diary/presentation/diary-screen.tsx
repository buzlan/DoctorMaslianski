import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { useCanonicalInvalidation } from "@/core/sync";
import {
  sharedDiaryLoader,
  type DiaryHistoryItem,
  type DiaryTodayResult,
} from "@/modules/diary/application";
import type { VasScore, Wellbeing } from "@/modules/diary/domain";
import { copy } from "@/shared/copy";
import { loadCivilTodayDate } from "@/shared/date/load-civil-today-date";
import { theme } from "@/shared/theme";
import { AppText, Card, Screen, ScreenHeader, ScreenState, Stack } from "@/shared/ui";

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

export function DiaryScreen() {
  const [viewState, setViewState] = useState<DiaryViewState>({
    status: "loading",
  });
  const [submitting, setSubmitting] = useState(false);
  const loadGenerationRef = useRef(0);

  const refresh = useCallback(() => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    return loadCivilTodayDate().then((onDate) =>
      sharedDiaryLoader.load(onDate).then((result) => {
        if (loadGenerationRef.current === generation) {
          setViewState(toViewState(result));
        }
      }),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useCanonicalInvalidation("diary", refresh);

  function submit(answers: {
    pain: VasScore;
    swelling: VasScore;
    wellbeing: Wellbeing;
  }) {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    setSubmitting(true);

    void loadCivilTodayDate()
      .then((onDate) => sharedDiaryLoader.submit(onDate, answers))
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
        <ScreenHeader title={copy.diary.title} subtitle={copy.diary.subtitle} />
        {viewState.status === "loading" ? (
          <ScreenState message={copy.diary.loading} />
        ) : null}
        {viewState.status === "no_active_treatment" ? (
          <ScreenState message={copy.diary.noActiveTreatment} />
        ) : null}
        {viewState.status === "error" ? (
          <ScreenState
            message={copy.diary.loadError}
            actionLabel={copy.diary.retry}
            onAction={() => {
              const generation = loadGenerationRef.current + 1;
              loadGenerationRef.current = generation;
              setViewState({ status: "loading" });
              void loadCivilTodayDate().then((onDate) =>
                sharedDiaryLoader.load(onDate).then((result) => {
                  if (loadGenerationRef.current === generation) {
                    setViewState(toViewState(result));
                  }
                }),
              );
            }}
          />
        ) : null}
        {viewState.status === "completed" ? (
          <Card variant="tinted">
            <AppText>{copy.diary.completedToday}</AppText>
          </Card>
        ) : null}
        {showHistory ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
