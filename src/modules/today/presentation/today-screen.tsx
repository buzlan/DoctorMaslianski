import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { useCanonicalInvalidation } from "@/core/sync";
import {
  ClinicContactSection,
  loadSharedClinicContact,
  type ClinicContact,
} from "@/modules/clinic-contact";
import {
  sharedTodayLoader,
  type TodayAssignmentItem,
  type TodayLoadResult,
  type TodayOverview,
} from "@/modules/today/application";
import { CurrentAppointmentBlock } from "@/modules/treatment/presentation/current-appointment-block";
import { copy } from "@/shared/copy";
import { loadCivilTodayDate } from "@/shared/date/load-civil-today-date";
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

async function requestTodayLoad() {
  const onDate = await loadCivilTodayDate();
  return sharedTodayLoader.load(onDate);
}

function requestTodayAndContact() {
  return Promise.all([requestTodayLoad(), loadSharedClinicContact()]);
}

function TodayAssignmentRow({
  assignment,
  pending,
  onToggle,
}: {
  assignment: TodayAssignmentItem;
  pending: boolean;
  onToggle: (assignment: TodayAssignmentItem) => void;
}) {
  const colors = getColors(useColorScheme());

  return (
    <Stack gap="xs">
      <View
        accessible
        accessibilityLabel={
          assignment.completed ? copy.today.completed : undefined
        }
        style={styles.assignmentHeader}
      >
        <View
          style={[
            styles.completionMark,
            {
              borderColor: colors.textSecondary,
            },
            assignment.completed
              ? { backgroundColor: colors.accent, borderColor: colors.accent }
              : undefined,
          ]}
        >
          {assignment.completed ? (
            <AppText
              variant="caption"
              style={[styles.completionCheck, { color: colors.background }]}
            >
              ✓
            </AppText>
          ) : null}
        </View>
        <Stack gap="xs" style={styles.assignmentCopy}>
          {assignment.title ? <AppText>{assignment.title}</AppText> : null}
          {assignment.instruction ? (
            <AppText tone="secondary">{assignment.instruction}</AppText>
          ) : null}
          {assignment.completed ? (
            <AppText variant="caption">{copy.today.completed}</AppText>
          ) : null}
        </Stack>
      </View>
      <Button
        label={
          assignment.completed
            ? copy.today.markIncomplete
            : copy.today.markComplete
        }
        disabled={pending}
        onPress={() => onToggle(assignment)}
      />
    </Stack>
  );
}

function ReadyContent({
  overview,
  clinicContact,
  pendingAssignmentId,
  onToggle,
  onFillDiary,
  onAddPhoto,
}: {
  overview: ReadyOverview;
  clinicContact: ClinicContact;
  pendingAssignmentId: string | null;
  onToggle: (assignment: TodayAssignmentItem) => void;
  onFillDiary: () => void;
  onAddPhoto: () => void;
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
            <TodayAssignmentRow
              key={assignment.id}
              assignment={assignment}
              pending={pendingAssignmentId !== null}
              onToggle={onToggle}
            />
          ))}
        </Stack>
      )}
      {overview.diaryOpen ? (
        <Button label={copy.today.fillDiary} onPress={onFillDiary} />
      ) : null}
      {overview.photosRecordedToday === 1 ? (
        <AppText tone="secondary">{copy.today.photoAdded1}</AppText>
      ) : null}
      {overview.photosRecordedToday === 2 ? (
        <AppText tone="secondary">{copy.today.photoAdded2}</AppText>
      ) : null}
      {overview.photosRecordedToday === 3 ? (
        <AppText tone="secondary">{copy.today.photoAdded3}</AppText>
      ) : null}
      {overview.photoAddOpen ? (
        <Button label={copy.today.addPhoto} onPress={onAddPhoto} />
      ) : null}
      <CurrentAppointmentBlock appointment={overview.currentAppointment} />
      <ClinicContactSection contact={clinicContact} />
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
  const [clinicContact, setClinicContact] = useState<ClinicContact>({});
  const loadGenerationRef = useRef(0);

  const refresh = useCallback(() => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    return requestTodayAndContact().then(([result, contact]) => {
      if (loadGenerationRef.current === generation) {
        setViewState(toViewState(result));
        if (result.status === "ready") {
          setClinicContact(contact);
        }
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useCanonicalInvalidation("today", refresh);

  function toggleAssignment(assignment: TodayAssignmentItem) {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    setPendingAssignmentId(assignment.id);

    void loadCivilTodayDate().then((onDate) => {
      const request = assignment.completed
        ? sharedTodayLoader.uncompleteAssignment(assignment.id, onDate)
        : sharedTodayLoader.completeAssignment(assignment.id, onDate);

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
                void requestTodayAndContact().then(([result, contact]) => {
                  if (loadGenerationRef.current === generation) {
                    setViewState(toViewState(result));
                    if (result.status === "ready") {
                      setClinicContact(contact);
                    }
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
              clinicContact={clinicContact}
              pendingAssignmentId={pendingAssignmentId}
              onToggle={toggleAssignment}
              onFillDiary={() => {
                router.navigate("/diary");
              }}
              onAddPhoto={() => {
                router.push("/photo-capture");
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
  assignmentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  completionMark: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: theme.radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  completionCheck: {
    lineHeight: 16,
  },
  assignmentCopy: {
    flex: 1,
  },
});
