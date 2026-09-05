import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";

import { useCanonicalInvalidation } from "@/core/sync";
import {
  loadSharedTreatmentTimeline,
  type TimelineMilestone,
  type TimelinePeriod,
  type TreatmentTimeline,
  type TreatmentTimelineLoadResult,
} from "@/modules/treatment/application";
import { copy } from "@/shared/copy";
import { loadCivilTodayDate } from "@/shared/date/load-civil-today-date";
import { getColors, theme } from "@/shared/theme";
import { AppText, Screen, Stack } from "@/shared/ui";

import { CurrentAppointmentBlock } from "./current-appointment-block";
import { formatCalendarDate } from "./format-calendar-date";

type ReadyTimeline = Extract<TreatmentTimeline, { kind: "ready" }>;

type TreatmentViewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "no_active_treatment" }
  | { status: "ready"; timeline: ReadyTimeline };

function toViewState(result: TreatmentTimelineLoadResult): TreatmentViewState {
  if (result.status === "ready") {
    return { status: "ready", timeline: result.timeline };
  }

  return result;
}

async function requestTimelineLoad() {
  const onDate = await loadCivilTodayDate();
  return loadSharedTreatmentTimeline(onDate);
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

function MilestoneRow({ milestone }: { milestone: TimelineMilestone }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={milestoneAccessibilityLabel(milestone)}
      onPress={() => {
        router.push({
          pathname: "/treatment/[milestoneId]",
          params: { milestoneId: milestone.id },
        });
      }}
    >
      <Stack gap="xs">
        {milestone.title !== undefined ? <AppText>{milestone.title}</AppText> : null}
        {milestone.occurredOn !== undefined ? (
          <AppText variant="caption" tone="secondary">
            {formatCalendarDate(milestone.occurredOn)}
          </AppText>
        ) : null}
      </Stack>
    </Pressable>
  );
}

function ReadyContent({ timeline }: { timeline: ReadyTimeline }) {
  const currentPeriod = timeline.periods.find((period) => period.isCurrent);
  const previousPeriods = timeline.periods.filter((period) => !period.isCurrent);
  const showEmpty = !hasMilestoneRows(timeline);

  return (
    <Stack gap="md">
      {timeline.periodDayNumber !== null ? (
        <AppText>
          {copy.treatment.periodDayLabel} {timeline.periodDayNumber}
        </AppText>
      ) : null}
      {currentPeriod?.milestones.map((milestone) => (
        <MilestoneRow key={milestone.id} milestone={milestone} />
      ))}
      {showEmpty ? (
        <AppText tone="secondary">{copy.treatment.emptyMilestones}</AppText>
      ) : null}
      {previousPeriods.map((period) => (
        <Stack key={period.id} gap="sm">
          <AppText variant="caption" tone="secondary">
            {formatPeriodRange(period)}
          </AppText>
          {period.milestones.map((milestone) => (
            <MilestoneRow key={milestone.id} milestone={milestone} />
          ))}
        </Stack>
      ))}
      {timeline.ungroupedMilestones.map((milestone) => (
        <MilestoneRow key={milestone.id} milestone={milestone} />
      ))}
      <CurrentAppointmentBlock appointment={timeline.currentAppointment} />
    </Stack>
  );
}

export function TreatmentScreen() {
  const colors = getColors(useColorScheme());
  const [viewState, setViewState] = useState<TreatmentViewState>({
    status: "loading",
  });
  const loadGenerationRef = useRef(0);

  const refresh = useCallback(() => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    return requestTimelineLoad().then((result) => {
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

  useCanonicalInvalidation("treatment", refresh);

  return (
    <Screen edges={["top", "left", "right"]} style={styles.content}>
      <Stack gap="md" style={styles.body}>
        <AppText variant="title">{copy.treatment.title}</AppText>
        {viewState.status === "loading" ? (
          <AppText tone="secondary">{copy.treatment.loading}</AppText>
        ) : null}
        {viewState.status === "no_active_treatment" ? (
          <AppText tone="secondary">{copy.treatment.noActiveTreatment}</AppText>
        ) : null}
        {viewState.status === "error" ? (
          <Stack gap="md">
            <AppText tone="secondary">{copy.treatment.loadError}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.treatment.retry}
              onPress={() => {
                const generation = loadGenerationRef.current + 1;
                loadGenerationRef.current = generation;
                setViewState({ status: "loading" });
                void requestTimelineLoad().then((result) => {
                  if (loadGenerationRef.current === generation) {
                    setViewState(toViewState(result));
                  }
                });
              }}
            >
              <AppText style={{ color: colors.accent }}>
                {copy.treatment.retry}
              </AppText>
            </Pressable>
          </Stack>
        ) : null}
        {viewState.status === "ready" ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <ReadyContent timeline={viewState.timeline} />
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
});
