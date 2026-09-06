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
import {
  AppText,
  Card,
  CompletionMark,
  IconWell,
  Screen,
  ScreenHeader,
  ScreenState,
  Stack,
} from "@/shared/ui";

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

function photoStatusCopy(count: 1 | 2 | 3): string {
  if (count === 1) {
    return copy.today.photoAdded1;
  }
  if (count === 2) {
    return copy.today.photoAdded2;
  }
  return copy.today.photoAdded3;
}

function assignmentLabel(assignment: TodayAssignmentItem): string {
  if (assignment.title !== undefined && assignment.title.length > 0) {
    return assignment.title;
  }
  return copy.today.tasksLabel;
}

function TodayAssignmentRow({
  assignment,
  pending,
  onToggle,
  showDivider,
}: {
  assignment: TodayAssignmentItem;
  pending: boolean;
  onToggle: (assignment: TodayAssignmentItem) => void;
  showDivider: boolean;
}) {
  const colors = getColors(useColorScheme());

  return (
    <View>
      <View
        style={[
          styles.assignmentRow,
          assignment.completed
            ? { backgroundColor: colors.accentSoft }
            : undefined,
        ]}
      >
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
        <Stack gap="xs" style={styles.assignmentCopy}>
          {assignment.title ? (
            <AppText variant="title">{assignment.title}</AppText>
          ) : null}
          {assignment.instruction ? (
            <AppText tone="secondary">{assignment.instruction}</AppText>
          ) : null}
          {assignment.completed ? (
            <AppText variant="label" style={{ color: colors.accent }}>
              {copy.today.completed}
            </AppText>
          ) : null}
        </Stack>
      </View>
      {showDivider ? (
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      ) : null}
    </View>
  );
}

function ActionCard({
  title,
  detail,
  icon,
  onPress,
}: {
  title: string;
  detail?: string;
  icon: "camera-outline" | "book-outline";
  onPress?: () => void;
}) {
  const body = (
    <Card variant="outlined">
      <View style={styles.ctaRow}>
        <IconWell name={icon} />
        <Stack gap="xs" style={styles.ctaCopy}>
          <AppText variant="title">{title}</AppText>
          {detail !== undefined ? (
            <AppText tone="secondary">{detail}</AppText>
          ) : null}
        </Stack>
      </View>
    </Card>
  );

  if (onPress === undefined) {
    return body;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.84 : 1 }]}
    >
      {body}
    </Pressable>
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
        <Card variant="tinted">
          <AppText variant="display">
            {copy.today.periodDayLabel} {overview.periodDayNumber}
          </AppText>
        </Card>
      ) : null}
      <Card variant="elevated" style={styles.tasksCard}>
        <Stack gap="sm">
          <AppText variant="title">{copy.today.tasksLabel}</AppText>
          {!hasAssignments ? (
            <AppText tone="secondary">{copy.today.noActionsForToday}</AppText>
          ) : (
            overview.assignments.map((assignment, index) => (
              <TodayAssignmentRow
                key={assignment.id}
                assignment={assignment}
                pending={pendingAssignmentId !== null}
                onToggle={onToggle}
                showDivider={index < overview.assignments.length - 1}
              />
            ))
          )}
        </Stack>
      </Card>
      {overview.diaryOpen ? (
        <ActionCard
          title={copy.today.fillDiary}
          icon="book-outline"
          onPress={onFillDiary}
        />
      ) : null}
      {overview.photosRecordedToday === 1 ||
      overview.photosRecordedToday === 2 ||
      overview.photosRecordedToday === 3 ||
      overview.photoAddOpen ? (
        <ActionCard
          title={copy.today.addPhoto}
          detail={
            overview.photosRecordedToday === 1 ||
            overview.photosRecordedToday === 2 ||
            overview.photosRecordedToday === 3
              ? photoStatusCopy(overview.photosRecordedToday)
              : undefined
          }
          icon="camera-outline"
          onPress={overview.photoAddOpen ? onAddPhoto : undefined}
        />
      ) : null}
      <CurrentAppointmentBlock appointment={overview.currentAppointment} />
      <ClinicContactSection contact={clinicContact} />
    </Stack>
  );
}

export function TodayScreen() {
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
        <ScreenHeader
          title={copy.today.title}
          subtitle={copy.today.subtitle}
        />
        {viewState.status === "loading" ? (
          <ScreenState message={copy.today.loading} />
        ) : null}
        {viewState.status === "no_active_treatment" ? (
          <ScreenState message={copy.today.noActiveTreatment} />
        ) : null}
        {viewState.status === "error" ? (
          <ScreenState
            message={copy.today.loadError}
            actionLabel={copy.today.retry}
            onAction={() => {
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
          />
        ) : null}
        {viewState.status === "ready" ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
    paddingBottom: theme.spacing.xl,
  },
  tasksCard: {
    paddingVertical: theme.spacing.md,
  },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.lg,
  },
  assignmentCopy: {
    flex: 1,
    paddingTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: theme.spacing.sm,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  ctaCopy: {
    flex: 1,
  },
});
