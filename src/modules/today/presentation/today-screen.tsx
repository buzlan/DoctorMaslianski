import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { DevResetLocalSessionControl } from "@/core/auth/dev-reset-local-session-control";
import { useCanonicalInvalidation } from "@/core/sync";
import {
  sharedTodayLoader,
  type TodayAssignmentItem,
  type TodayLoadResult,
  type TodayOverview,
} from "@/modules/today/application";
import { copy } from "@/shared/copy";
import { loadCivilTodayDate } from "@/shared/date/load-civil-today-date";
import { getColors, theme } from "@/shared/theme";
import {
  AppText,
  Card,
  IconWell,
  Screen,
  ScreenState,
  Stack,
  TabScreenHeader,
} from "@/shared/ui";
import {
  STICKY_CONTACT_SCROLL_PADDING,
  SupportContactCard,
} from "./support-contact-card";
import { TodayAppointmentCard } from "./today-appointment-card";
import { TodayAssignmentRow } from "./today-assignment-row";
import { TodayPeriodProgressCard } from "./today-period-progress-card";

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

function photoStatusCopy(count: 1 | 2 | 3): string {
  if (count === 1) {
    return copy.today.photoAdded1;
  }
  if (count === 2) {
    return copy.today.photoAdded2;
  }
  return copy.today.photoAdded3;
}

function ActionCard({
  title,
  detail,
  icon,
  onPress,
}: {
  title: string;
  detail?: string;
  icon: "book-outline";
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

function PhotoControlCard({
  statusDetail,
  canAdd,
  onAddPhoto,
}: {
  statusDetail?: string;
  canAdd: boolean;
  onAddPhoto: () => void;
}) {
  const colors = getColors(useColorScheme());

  return (
    <Card variant="outlined">
      <View style={styles.ctaRow}>
        <IconWell name="camera-outline" />
        <Stack gap="xs" style={styles.ctaCopy}>
          <AppText variant="title" numberOfLines={1}>
            {copy.today.photoControlTitle}
          </AppText>
          <AppText tone="secondary" numberOfLines={3}>
            {copy.today.photoControlBody}
          </AppText>
          {statusDetail !== undefined ? (
            <AppText variant="label" style={{ color: colors.accent }}>
              {statusDetail}
            </AppText>
          ) : null}
        </Stack>
        {canAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.today.photoControlAction}
            onPress={onAddPhoto}
            style={({ pressed }) => [
              styles.compactAction,
              {
                borderColor: colors.accent,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <AppText variant="label" style={{ color: colors.accent }}>
              {copy.today.photoControlAction}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

function ReadyContent({
  overview,
  pendingAssignmentId,
  onToggle,
  onFillDiary,
  onAddPhoto,
}: {
  overview: ReadyOverview;
  pendingAssignmentId: string | null;
  onToggle: (assignment: TodayAssignmentItem) => void;
  onFillDiary: () => void;
  onAddPhoto: () => void;
}) {
  const hasAssignments = overview.assignments.length > 0;

  return (
    <Stack gap="md">
      {overview.periodProgress !== null ? (
        <TodayPeriodProgressCard progress={overview.periodProgress} />
      ) : null}
      <Card variant="elevated" style={styles.tasksCard}>
        <Stack gap="xs">
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
      {overview.currentAppointment !== null ? (
        <TodayAppointmentCard appointment={overview.currentAppointment} />
      ) : null}
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
        <PhotoControlCard
          statusDetail={
            overview.photosRecordedToday === 1 ||
            overview.photosRecordedToday === 2 ||
            overview.photosRecordedToday === 3
              ? photoStatusCopy(overview.photosRecordedToday)
              : undefined
          }
          canAdd={overview.photoAddOpen}
          onAddPhoto={onAddPhoto}
        />
      ) : null}
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
  const loadGenerationRef = useRef(0);

  const refresh = useCallback(() => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    return requestTodayLoad().then((result) => {
      if (loadGenerationRef.current === generation) {
        setViewState(toViewState(result));
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
      <View style={styles.body}>
        <TabScreenHeader
          title={copy.today.title}
          subtitle={copy.today.subtitle}
        />

        <View style={styles.main}>
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

                void requestTodayLoad().then((result) => {
                  if (loadGenerationRef.current === generation) {
                    setViewState(toViewState(result));
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
              <Stack gap="md">
                <ReadyContent
                  overview={viewState.overview}
                  pendingAssignmentId={pendingAssignmentId}
                  onToggle={toggleAssignment}
                  onFillDiary={() => {
                    router.navigate("/diary");
                  }}
                  onAddPhoto={() => {
                    router.push("/photo-capture");
                  }}
                />
                <DevResetLocalSessionControl />
              </Stack>
            </ScrollView>
          ) : null}
          {viewState.status !== "ready" ? (
            <DevResetLocalSessionControl />
          ) : null}
        </View>

        {/* Outside ScrollView — pinned above the tab bar (scene already ends above tabs). */}
        <SupportContactCard />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  body: {
    flex: 1,
    gap: theme.spacing.md,
  },
  main: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: STICKY_CONTACT_SCROLL_PADDING,
  },
  tasksCard: {
    paddingVertical: theme.spacing.md,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  ctaCopy: {
    flex: 1,
    minWidth: 0,
  },
  compactAction: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
