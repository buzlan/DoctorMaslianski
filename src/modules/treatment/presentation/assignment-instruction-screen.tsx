import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useCanonicalInvalidation } from "@/core/sync";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import {
  AppText,
  BackIconButton,
  Card,
  Screen,
  ScreenHeader,
  ScreenState,
  Stack,
} from "@/shared/ui";
import {
  loadSharedAssignmentInstruction,
  type AssignmentInstructionLoadResult,
} from "../application/load-assignment-instruction";
import { DoctorPhotoPager } from "./doctor-photo-pager";

export function AssignmentInstructionScreen({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<
    AssignmentInstructionLoadResult | { status: "loading" }
  >({
    status: "loading",
  });
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    const result = await loadSharedAssignmentInstruction(assignmentId);
    if (current === generation.current) setState(result);
  }, [assignmentId]);
  useFocusEffect(
    useCallback(() => {
      setState({ status: "loading" });
      void refresh();
      return () => {
        generation.current += 1;
      };
    }, [refresh]),
  );
  useCanonicalInvalidation("assignment-detail", refresh);

  return (
    <Screen style={styles.screen}>
      <Stack gap="md" style={styles.body}>
        <View style={styles.navigation}>
          <BackIconButton
            accessibilityLabel={copy.treatment.back}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          />
          <AppText
            variant="caption"
            tone="secondary"
            style={styles.navigationTitle}
          >
            {copy.assignmentInstruction.title}
          </AppText>
        </View>
        {state.status === "loading" && (
          <ScreenState message={copy.treatment.loading} />
        )}
        {state.status === "not_found" && (
          <ScreenState message={copy.assignmentInstruction.notFound} />
        )}
        {state.status === "error" && (
          <ScreenState
            message={copy.treatment.loadError}
            actionLabel={copy.treatment.retry}
            onAction={() => {
              setState({ status: "loading" });
              void refresh();
            }}
          />
        )}
        {state.status === "ready" && (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.scrollContent}
          >
            <Stack gap="lg">
              <ScreenHeader
                title={state.title || copy.assignmentInstruction.title}
              />
              {state.instruction.heading || state.instruction.text ? (
                <Card variant="elevated" style={styles.instructionCard}>
                  <Stack gap="md">
                    {state.instruction.heading ? (
                      <AppText variant="title" accessibilityRole="header">
                        {state.instruction.heading}
                      </AppText>
                    ) : null}
                    {state.instruction.text ? (
                      <AppText selectable style={styles.instructionText}>
                        {state.instruction.text}
                      </AppText>
                    ) : null}
                  </Stack>
                </Card>
              ) : null}
              {state.photos.length > 0 || state.photosUnavailable ? (
                <Card variant="elevated">
                  <Stack gap="md">
                    <View style={styles.photosHeader}>
                      <AppText
                        variant="title"
                        accessibilityRole="header"
                        style={styles.photosTitle}
                      >
                        {copy.assignmentInstruction.photosTitle}
                      </AppText>
                      {state.photos.length > 0 ? (
                        <AppText variant="caption" tone="secondary">
                          {state.photos.length}
                        </AppText>
                      ) : null}
                    </View>
                    {state.photosUnavailable ? (
                      <ScreenState
                        message={copy.assignmentInstruction.photosUnavailable}
                        actionLabel={copy.treatment.retry}
                        onAction={() => void refresh()}
                      />
                    ) : null}
                    {state.photos.length > 0 ? (
                      <DoctorPhotoPager
                        key={JSON.stringify(
                          state.photos.map((photo) => photo.id),
                        )}
                        items={state.photos}
                        photoLabel={copy.assignmentInstruction.photoLabel}
                      />
                    ) : null}
                  </Stack>
                </Card>
              ) : null}
            </Stack>
          </ScrollView>
        )}
      </Stack>
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { padding: theme.spacing.md },
  body: { flex: 1, width: "100%", maxWidth: 720, alignSelf: "center" },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  navigationTitle: { flex: 1 },
  instructionCard: { padding: theme.spacing.lg },
  instructionText: { lineHeight: 25 },
  photosHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  photosTitle: { flex: 1 },
  scrollContent: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
  },
});
