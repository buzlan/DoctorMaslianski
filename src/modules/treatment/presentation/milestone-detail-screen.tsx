import { Image } from "expo-image";
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
import { AppText, Button, Screen, Stack } from "@/shared/ui";

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

function doctorPhotoLabel(index: number): string {
  return `${copy.treatment.doctorPhotoAccessibilityLabel} ${index + 1}`;
}

function DoctorPhotosSection({ doctorPhotos }: { doctorPhotos: MilestoneDoctorPhotos }) {
  return (
    <Stack gap="sm">
      <AppText>{copy.treatment.doctorPhotosLabel}</AppText>
      {doctorPhotos.status === "unavailable" ? (
        <AppText tone="secondary">{copy.treatment.doctorPhotosUnavailable}</AppText>
      ) : null}
      {doctorPhotos.status === "ready" && doctorPhotos.items.length === 0 ? (
        <AppText tone="secondary">{copy.treatment.doctorPhotosEmpty}</AppText>
      ) : null}
      {doctorPhotos.status === "ready"
        ? doctorPhotos.items.map((photo, index) => (
            <Image
              key={photo.id}
              source={{ uri: photo.displayUri }}
              style={styles.photo}
              contentFit="contain"
              accessibilityLabel={doctorPhotoLabel(index)}
            />
          ))
        : null}
    </Stack>
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
          label={copy.treatment.back}
          onPress={() => {
            goBack(router);
          }}
        />
        {viewState.status === "loading" ? (
          <AppText tone="secondary">{copy.treatment.loading}</AppText>
        ) : null}
        {viewState.status === "not_found" ? (
          <AppText tone="secondary">{copy.treatment.milestoneNotFound}</AppText>
        ) : null}
        {viewState.status === "error" ? (
          <Stack gap="md">
            <AppText tone="secondary">{copy.treatment.loadError}</AppText>
            <Button
              label={copy.treatment.retry}
              onPress={() => {
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
          </Stack>
        ) : null}
        {viewState.status === "ready" ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <Stack gap="md">
              <Stack gap="xs">
                <AppText variant="title">{headingFor(viewState.detail)}</AppText>
                {viewState.detail.milestone.occurredOn !== undefined ? (
                  <AppText variant="caption" tone="secondary">
                    {formatCalendarDate(viewState.detail.milestone.occurredOn)}
                  </AppText>
                ) : null}
              </Stack>
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
  },
  photo: {
    width: "100%",
    height: 280,
    backgroundColor: "transparent",
  },
});
