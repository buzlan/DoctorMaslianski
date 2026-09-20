import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { useCanonicalInvalidation } from "@/core/sync";
import {
  loadSharedMilestoneDetail,
  type MilestoneDetail,
  type MilestoneDetailLoadResult,
  type MilestoneDoctorPhotos,
} from "@/modules/treatment/application";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import {
  AppText,
  Button,
  Card,
  Screen,
  ScreenHeader,
  ScreenState,
  Stack,
} from "@/shared/ui";

import { DoctorPhotoPager } from "./doctor-photo-pager";
import { formatCalendarDate } from "./format-calendar-date";

type ReadyDetail = Extract<MilestoneDetail, { kind: "ready" }>;

type MilestoneDetailViewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not_found" }
  | { status: "ready"; detail: ReadyDetail };

function toViewState(result: MilestoneDetailLoadResult): MilestoneDetailViewState {
  if (result.status === "ready") {
    return { status: "ready", detail: result.detail };
  }

  return result;
}

function firstParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  return value?.[0] ?? "";
}

function headingFor(detail: ReadyDetail): string {
  if (detail.milestone.title !== undefined && detail.milestone.title.length > 0) {
    return detail.milestone.title;
  }

  return copy.treatment.milestoneDetailTitle;
}

function goBack(router: ReturnType<typeof useRouter>) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/treatment");
}

function requestLoad(id: string) {
  return loadSharedMilestoneDetail(id);
}

function DoctorPhotosSection({ doctorPhotos }: { doctorPhotos: MilestoneDoctorPhotos }) {
  return (
    <Card variant="elevated">
      <Stack gap="sm">
        <AppText variant="title">{copy.treatment.doctorPhotosLabel}</AppText>
        {doctorPhotos.status === "unavailable" ? (
          <AppText tone="secondary">{copy.treatment.doctorPhotosUnavailable}</AppText>
        ) : null}
        {doctorPhotos.status === "ready" && doctorPhotos.items.length === 0 ? (
          <AppText tone="secondary">{copy.treatment.doctorPhotosEmpty}</AppText>
        ) : null}
        {doctorPhotos.status === "ready" && doctorPhotos.items.length > 0 ? (
          <DoctorPhotoPager items={doctorPhotos.items} />
        ) : null}
      </Stack>
    </Card>
  );
}

type MilestoneDetailScreenProps = {
  milestoneId: string | string[] | undefined;
};

export function MilestoneDetailScreen({ milestoneId }: MilestoneDetailScreenProps) {
  const router = useRouter();
  const resolvedId = firstParam(milestoneId);
  const [viewState, setViewState] = useState<MilestoneDetailViewState>({
    status: "loading",
  });
  const loadGenerationRef = useRef(0);

  const refresh = useCallback(() => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    return requestLoad(resolvedId).then((result) => {
      if (loadGenerationRef.current === generation) {
        setViewState(toViewState(result));
      }
    });
  }, [resolvedId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useCanonicalInvalidation("milestone-detail", refresh);

  return (
    <Screen edges={["top", "left", "right"]} style={styles.content}>
      <Stack gap="md" style={styles.body}>
        <Button
          variant="tertiary"
          label={copy.treatment.back}
          onPress={() => {
            goBack(router);
          }}
        />
        {viewState.status === "loading" ? (
          <ScreenState message={copy.treatment.loading} />
        ) : null}
        {viewState.status === "not_found" ? (
          <ScreenState message={copy.treatment.milestoneNotFound} />
        ) : null}
        {viewState.status === "error" ? (
          <ScreenState
            message={copy.treatment.loadError}
            actionLabel={copy.treatment.retry}
            onAction={() => {
              const generation = loadGenerationRef.current + 1;
              loadGenerationRef.current = generation;
              setViewState({ status: "loading" });
              void requestLoad(resolvedId).then((result) => {
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
              <ScreenHeader
                title={headingFor(viewState.detail)}
                subtitle={
                  viewState.detail.milestone.occurredOn !== undefined
                    ? formatCalendarDate(viewState.detail.milestone.occurredOn)
                    : undefined
                }
              />
              <DoctorPhotosSection doctorPhotos={viewState.detail.doctorPhotos} />
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
