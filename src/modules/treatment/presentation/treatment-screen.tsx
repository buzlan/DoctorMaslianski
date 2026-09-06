import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { useCanonicalInvalidation } from "@/core/sync";
import {
  loadSharedTreatmentTimeline,
  type TimelineMilestone,
  type TimelinePeriod,
  type TreatmentTimeline,
  type TreatmentTimelineLoadResult,
} from "@/modules/treatment/application";
import { type CalendarDate } from "@/modules/treatment/domain";
import { copy } from "@/shared/copy";
import { loadCivilTodayDate } from "@/shared/date/load-civil-today-date";
import { getColors, theme } from "@/shared/theme";
import {
  AppText,
  Card,
  Screen,
  ScreenHeader,
  ScreenState,
  Stack,
  TimelineNode,
  type TimelineNodeState,
} from "@/shared/ui";

import { CurrentAppointmentBlock } from "./current-appointment-block";
import { formatCalendarDate } from "./format-calendar-date";
import { milestoneVisualState } from "./milestone-visual-state";
import {
  currentTimelinePeriod,
  previousPeriodsChronological,
  sortMilestonesChronologically,
  timelineConnectorKind,
} from "./timeline-sections";

type ReadyTimeline = Extract<TreatmentTimeline, { kind: "ready" }>;

type TreatmentViewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "no_active_treatment" }
  | { status: "ready"; timeline: ReadyTimeline; onDate: CalendarDate };

function toViewState(
  result: TreatmentTimelineLoadResult,
  onDate: CalendarDate,
): TreatmentViewState {
  if (result.status === "ready") {
    return { status: "ready", timeline: result.timeline, onDate };
  }

  return result;
}

async function requestTimelineLoad() {
  const onDate = await loadCivilTodayDate();
  const result = await loadSharedTreatmentTimeline(onDate);
  return { result, onDate };
}

function formatPeriodRange(period: TimelinePeriod): string {
  if (period.endedOn === undefined) {
    return formatCalendarDate(period.startedOn);
  }

  return `${formatCalendarDate(period.startedOn)} – ${formatCalendarDate(period.endedOn)}`;
}

function hasMilestoneRows(timeline: ReadyTimeline): boolean {
  return (
    timeline.ungroupedMilestones.length > 0 ||
    timeline.periods.some((period) => period.milestones.length > 0)
  );
}

function milestoneAccessibilityLabel(milestone: TimelineMilestone): string {
  if (milestone.title !== undefined && milestone.title.length > 0) {
    return milestone.title;
  }

  if (milestone.occurredOn !== undefined) {
    return formatCalendarDate(milestone.occurredOn);
  }

  return copy.treatment.milestoneDetailTitle;
}

function flattenVisibleMilestones(
  previousPeriods: readonly TimelinePeriod[],
  currentPeriod: TimelinePeriod | undefined,
  ungroupedDated: readonly TimelineMilestone[],
  ungroupedUndated: readonly TimelineMilestone[],
): readonly TimelineMilestone[] {
  return [
    ...previousPeriods.flatMap((period) => period.milestones),
    ...(currentPeriod?.milestones ?? []),
    ...ungroupedDated,
    ...ungroupedUndated,
  ];
}

function MilestoneRow({
  milestone,
  onDate,
  nextState,
}: {
  milestone: TimelineMilestone;
  onDate: CalendarDate;
  nextState?: TimelineNodeState;
}) {
  const colors = getColors(useColorScheme());
  const router = useRouter();
  const state = milestoneVisualState(milestone.occurredOn, onDate);
  const connector = timelineConnectorKind(state, nextState);
  const isCurrent = state === "current";
  const isPast = state === "past";
  const isUndated = state === "undated";

  return (
    <View style={styles.timelineRow}>
      <View style={styles.nodeColumn}>
        <TimelineNode state={state} />
        {nextState === undefined ? null : connector === "solid" ? (
          <View
            style={[styles.connector, { backgroundColor: colors.accent }]}
          />
        ) : (
          <View
            style={[styles.connectorDashed, { borderColor: colors.border }]}
          />
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={milestoneAccessibilityLabel(milestone)}
        onPress={() => {
          router.push({
            pathname: "/treatment/[milestoneId]",
            params: { milestoneId: milestone.id },
          });
        }}
        style={({ pressed }) => [
          styles.milestoneCard,
          { opacity: pressed ? 0.86 : 1 },
        ]}
      >
        <Card
          variant={isCurrent ? "tinted" : isUndated ? "outlined" : "elevated"}
          style={
            isCurrent ? { borderColor: colors.accent, borderWidth: 2 } : undefined
          }
        >
          <Stack gap="xs">
            <AppText
              variant="title"
              tone={isPast || isUndated ? "secondary" : "primary"}
            >
              {milestone.title !== undefined
                ? milestone.title
                : copy.treatment.milestoneDetailTitle}
            </AppText>
            {milestone.occurredOn !== undefined ? (
              <AppText variant="caption" tone="secondary">
                {formatCalendarDate(milestone.occurredOn)}
              </AppText>
            ) : null}
            {milestone.doctorPhotoCount !== undefined &&
            milestone.doctorPhotoCount > 0 ? (
              <AppText variant="label" style={{ color: colors.accent }}>
                {copy.treatment.doctorPhotoCount} · {milestone.doctorPhotoCount}
              </AppText>
            ) : null}
          </Stack>
        </Card>
      </Pressable>
    </View>
  );
}

function PeriodBlock({
  header,
  milestones,
  onDate,
  visibleSequence,
}: {
  header?: ReactNode;
  milestones: readonly TimelineMilestone[];
  onDate: CalendarDate;
  visibleSequence: readonly TimelineMilestone[];
}) {
  return (
    <Stack gap="sm">
      {header}
      {milestones.map((milestone) => {
        const index = visibleSequence.findIndex((item) => item.id === milestone.id);
        const next = index >= 0 ? visibleSequence[index + 1] : undefined;
        return (
          <MilestoneRow
            key={milestone.id}
            milestone={milestone}
            onDate={onDate}
            nextState={
              next === undefined
                ? undefined
                : milestoneVisualState(next.occurredOn, onDate)
            }
          />
        );
      })}
    </Stack>
  );
}

function ReadyContent({
  timeline,
  onDate,
}: {
  timeline: ReadyTimeline;
  onDate: CalendarDate;
}) {
  const colors = getColors(useColorScheme());
  const currentPeriod = currentTimelinePeriod(timeline.periods);
  const previousPeriods = previousPeriodsChronological(timeline.periods).map(
    (period) => ({
      ...period,
      milestones: sortMilestonesChronologically(period.milestones),
    }),
  );
  const currentPeriodMilestones =
    currentPeriod === undefined
      ? []
      : sortMilestonesChronologically(currentPeriod.milestones);
  const ungrouped = sortMilestonesChronologically(timeline.ungroupedMilestones);
  const ungroupedDated = ungrouped.filter(
    (milestone) => milestone.occurredOn !== undefined,
  );
  const ungroupedUndated = ungrouped.filter(
    (milestone) => milestone.occurredOn === undefined,
  );
  const visibleSequence = flattenVisibleMilestones(
    previousPeriods,
    currentPeriod === undefined
      ? undefined
      : { ...currentPeriod, milestones: currentPeriodMilestones },
    ungroupedDated,
    ungroupedUndated,
  );
  const showEmpty = !hasMilestoneRows(timeline);

  return (
    <Stack gap="lg">
      {previousPeriods.map((period) => (
        <PeriodBlock
          key={period.id}
          onDate={onDate}
          milestones={period.milestones}
          visibleSequence={visibleSequence}
          header={
            <AppText variant="caption" tone="secondary">
              {formatPeriodRange(period)}
            </AppText>
          }
        />
      ))}
      {currentPeriod !== undefined ? (
        <PeriodBlock
          onDate={onDate}
          milestones={currentPeriodMilestones}
          visibleSequence={visibleSequence}
          header={
            <Card variant="tinted">
              <Stack gap="xs">
                <AppText variant="label" style={{ color: colors.accent }}>
                  {copy.treatment.currentPeriodLabel}
                </AppText>
                {timeline.periodDayNumber !== null ? (
                  <AppText variant="display">
                    {copy.treatment.periodDayLabel} {timeline.periodDayNumber}
                  </AppText>
                ) : null}
              </Stack>
            </Card>
          }
        />
      ) : null}
      {ungroupedDated.length > 0 ? (
        <PeriodBlock
          onDate={onDate}
          milestones={ungroupedDated}
          visibleSequence={visibleSequence}
        />
      ) : null}
      {ungroupedUndated.length > 0 ? (
        <PeriodBlock
          onDate={onDate}
          milestones={ungroupedUndated}
          visibleSequence={visibleSequence}
        />
      ) : null}
      {showEmpty ? (
        <Card variant="elevated">
          <AppText tone="secondary">{copy.treatment.emptyMilestones}</AppText>
        </Card>
      ) : null}
      <CurrentAppointmentBlock appointment={timeline.currentAppointment} />
    </Stack>
  );
}

export function TreatmentScreen() {
  const [viewState, setViewState] = useState<TreatmentViewState>({
    status: "loading",
  });
  const loadGenerationRef = useRef(0);

  const refresh = useCallback(() => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    return requestTimelineLoad().then(({ result, onDate }) => {
      if (loadGenerationRef.current === generation) {
        setViewState(toViewState(result, onDate));
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useCanonicalInvalidation("treatment", refresh);

  return (
    <Screen edges={["top", "left", "right"]} style={styles.content}>
      <Stack gap="md" style={styles.body}>
        <ScreenHeader
          title={copy.treatment.title}
          subtitle={copy.treatment.subtitle}
        />
        {viewState.status === "loading" ? (
          <ScreenState message={copy.treatment.loading} />
        ) : null}
        {viewState.status === "no_active_treatment" ? (
          <ScreenState message={copy.treatment.noActiveTreatment} />
        ) : null}
        {viewState.status === "error" ? (
          <ScreenState
            message={copy.treatment.loadError}
            actionLabel={copy.treatment.retry}
            onAction={() => {
              const generation = loadGenerationRef.current + 1;
              loadGenerationRef.current = generation;
              setViewState({ status: "loading" });
              void requestTimelineLoad().then(({ result, onDate }) => {
                if (loadGenerationRef.current === generation) {
                  setViewState(toViewState(result, onDate));
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
              timeline={viewState.timeline}
              onDate={viewState.onDate}
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
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.spacing.md,
  },
  nodeColumn: {
    width: 22,
    alignItems: "center",
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 18,
    marginTop: 4,
    borderRadius: 1,
  },
  connectorDashed: {
    width: 0,
    flex: 1,
    minHeight: 18,
    marginTop: 4,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
  },
  milestoneCard: {
    flex: 1,
    paddingBottom: theme.spacing.sm,
  },
});
