import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";

import { ClinicContactSection, type ClinicContact } from "@/modules/clinic-contact";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Screen, Stack } from "@/shared/ui";

import {
  sharedCompletionLoader,
  type CompletionScreenResult,
} from "../application";
import type { FeedbackScore, FeedbackSurvey } from "../domain";

import { FeedbackSurveyForm } from "./feedback-survey-form";

type CompletionViewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not_completed" }
  | {
      status: "ready";
      survey: FeedbackSurvey | null;
      clinicContact: ClinicContact;
    };

function toViewState(result: CompletionScreenResult): CompletionViewState {
  if (result.status === "ready") {
    return {
      status: "ready",
      survey: result.survey,
      clinicContact: result.clinicContact,
    };
  }
  return result;
}

export function CompletionScreen() {
  const colors = getColors(useColorScheme());
  const [viewState, setViewState] = useState<CompletionViewState>({
    status: "loading",
  });
  const [submitting, setSubmitting] = useState(false);
  const loadGenerationRef = useRef(0);

  const load = useCallback(() => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    void sharedCompletionLoader.loadScreen().then((result) => {
      if (loadGenerationRef.current === generation) {
        setViewState(toViewState(result));
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function submit(answers: {
    usefulnessScore: FeedbackScore;
    clarityScore: FeedbackScore;
  }) {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    setSubmitting(true);

    void sharedCompletionLoader
      .submit(answers)
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

  return (
    <Screen edges={["top", "left", "right"]} style={styles.content}>
      <Stack gap="md" style={styles.body}>
        <AppText variant="title">{copy.completion.title}</AppText>
        {viewState.status === "loading" ? (
          <AppText tone="secondary">{copy.completion.loading}</AppText>
        ) : null}
        {viewState.status === "not_completed" ? (
          <AppText tone="secondary">{copy.completion.notCompleted}</AppText>
        ) : null}
        {viewState.status === "error" ? (
          <Stack gap="md">
            <AppText tone="secondary">{copy.completion.loadError}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.completion.retry}
              onPress={() => {
                setViewState({ status: "loading" });
                load();
              }}
            >
              <AppText style={{ color: colors.accent }}>
                {copy.completion.retry}
              </AppText>
            </Pressable>
          </Stack>
        ) : null}
        {viewState.status === "ready" ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <Stack gap="lg">
              <AppText tone="secondary">{copy.completion.body}</AppText>
              <ClinicContactSection contact={viewState.clinicContact} />
              {viewState.survey !== null ? (
                <AppText tone="secondary">{copy.completion.submitted}</AppText>
              ) : (
                <FeedbackSurveyForm submitting={submitting} onSubmit={submit} />
              )}
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
