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
  ScreenState,
  Stack,
  TabScreenHeader,
  TimelineNode,
  type TimelineNodeState,
} from "@/shared/ui";

import { AppointmentContactModal } from "./appointment-contact-modal";
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
  | {
      status: "ready";
      timeline: ReadyTimeline;
      onDate: CalendarDate;
    };

function toViewState(
  result: TreatmentTimelineLoadResult,
  onDate: CalendarDate,
): TreatmentViewState {
  if (result.status === "ready") {
    return {
      status: "ready",
      timeline: result.timeline,
      onDate,
    };
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
  previousState,
}: {
  milestone: TimelineMilestone;
  onDate: CalendarDate;
  nextState?: TimelineNodeState;
  previousState?: TimelineNodeState;
}) {
  const colors = getColors(useColorScheme());
  const router = useRouter();
  const state = milestoneVisualState(milestone.occurredOn, onDate);

  const isCurrent = state === "current";
  const isUndated = state === "undated";

  const isAboveSolid =
    previousState !== undefined &&
    timelineConnectorKind(previousState, state) === "solid";

  const isBelowSolid = timelineConnectorKind(state, nextState) === "solid";

  const aboveColor = isCurrent ? colors.accent : colors.border;
  const belowColor = nextState === "current" ? colors.accent : colors.border;

  return (
    <View style={styles.timelineRow}>
      <View style={styles.nodeColumn}>
        {previousState !== undefined ? (
          <View
            style={[
              styles.connectorAbove,
              isAboveSolid ? styles.connector : styles.connectorDashed,
              isAboveSolid
                ? { backgroundColor: aboveColor }
                : { borderColor: colors.border },
            ]}
          />
        ) : null}

        <TimelineNode state={state} />

        {nextState !== undefined ? (
          <View
            style={[
              styles.connectorBelow,
              isBelowSolid ? styles.connector : styles.connectorDashed,
              isBelowSolid
                ? { backgroundColor: belowColor }
                : { borderColor: colors.border },
            ]}
          />
        ) : null}
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
          style={[
            styles.visitCard,
            isCurrent ? { borderColor: colors.accent } : undefined,
          ]}
        >
          <Stack gap="xs">
            <AppText variant="title" tone="primary">
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
        const index = visibleSequence.findIndex(
          (item) => item.id === milestone.id,
        );
        const next = index >= 0 ? visibleSequence[index + 1] : undefined;
        const previous = index > 0 ? visibleSequence[index - 1] : undefined;

        return (
          <MilestoneRow
            key={milestone.id}
            milestone={milestone}
            onDate={onDate}
            previousState={
              previous === undefined
                ? undefined
                : milestoneVisualState(previous.occurredOn, onDate)
            }
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
    </Stack>
  );
}

export function TreatmentScreen() {
  const [viewState, setViewState] = useState<TreatmentViewState>({
    status: "loading",
  });

  const [contactModalVisible, setContactModalVisible] = useState(false);
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
      <View style={styles.body}>
        <TabScreenHeader
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
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {viewState.timeline.periodDayNumber !== null ? (
                <AppText variant="display" style={styles.periodHeading}>
                  {copy.treatment.periodDayLabel}{" "}
                  {viewState.timeline.periodDayNumber}
                </AppText>
              ) : null}

              <ReadyContent
                timeline={viewState.timeline}
                onDate={viewState.onDate}
              />
            </ScrollView>

            <View style={styles.appointmentFooter}>
              <CurrentAppointmentBlock
                appointment={viewState.timeline.currentAppointment}
                onPressDetails={() => setContactModalVisible(true)}
              />
            </View>
          </>
        ) : null}
      </View>

      <AppointmentContactModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
      />
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
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.md,
  },
  appointmentFooter: {
    flexShrink: 0,
  },
  periodHeading: {
    marginBottom: theme.spacing.lg,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  nodeColumn: {
    width: 32,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  connector: {
    position: "absolute",
    width: 2,
    borderRadius: 1,
  },
  connectorDashed: {
    position: "absolute",
    width: 0,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
  },
  connectorAbove: {
    top: -theme.spacing.sm * 2,
    bottom: "50%",
    marginBottom: 20,
  },
  connectorBelow: {
    top: "50%",
    marginTop: 20,
    bottom: 0,
  },
  milestoneCard: {
    flex: 1,
  },
  visitCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
});
