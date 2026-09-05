import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ClinicContactSection, type ClinicContact } from "@/modules/clinic-contact";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import {
  AppText,
  Card,
  IconWell,
  Screen,
  ScreenHeader,
  ScreenState,
  Stack,
} from "@/shared/ui";

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
        {viewState.status === "loading" ? (
          <ScreenState message={copy.completion.loading} />
        ) : null}
        {viewState.status === "not_completed" ? (
          <ScreenState message={copy.completion.notCompleted} />
        ) : null}
        {viewState.status === "error" ? (
          <ScreenState
            message={copy.completion.loadError}
            actionLabel={copy.completion.retry}
            onAction={() => {
              setViewState({ status: "loading" });
              load();
            }}
          />
        ) : null}
        {viewState.status === "ready" ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Stack gap="lg" style={styles.ready}>
              <View style={styles.heroMark}>
                <IconWell name="checkmark" shape="circle" size={64} />
              </View>
              <ScreenHeader
                title={copy.completion.title}
                subtitle={copy.completion.body}
              />
              <ClinicContactSection contact={viewState.clinicContact} />
              {viewState.survey !== null ? (
                <Card variant="elevated">
                  <AppText tone="secondary">{copy.completion.submitted}</AppText>
                </Card>
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
  ready: {
    alignItems: "stretch",
  },
  heroMark: {
    alignItems: "center",
  },
});

