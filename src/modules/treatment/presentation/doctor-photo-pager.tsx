import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

import type { MilestoneDoctorPhotoItem } from "@/modules/treatment/application";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppIcon, AppText, Stack } from "@/shared/ui";
import { DoctorPhotoViewer } from "./doctor-photo-viewer";

type DoctorPhotoPagerProps = {
  items: readonly MilestoneDoctorPhotoItem[];
  photoLabel?: string;
};

type PhotoSlideProps = {
  photo: MilestoneDoctorPhotoItem;
  photoIndex: number;
  photoLabel?: string;
  single: boolean;
  onOpen: () => void;
};

function PhotoSlide({
  photo,
  photoIndex,
  photoLabel,
  single,
  onOpen,
}: PhotoSlideProps) {
  const colors = getColors(useColorScheme());
  const { height: windowHeight } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={
        single
          ? {
              width: "100%",
              height:
                width > 0
                  ? Math.min(width / aspectRatio, windowHeight * 0.55)
                  : 280,
            }
          : styles.thumbnail
      }
    >
      <View style={styles.frame}>
        {status !== "error" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              photoLabel
                ? `${photoLabel} ${photoIndex + 1}`
                : copy.treatment.photoOpenAccessibilityLabel.replace(
                    "{number}",
                    String(photoIndex + 1),
                  )
            }
            onPress={onOpen}
            style={styles.photo}
          >
            <Image
              key={attempt}
              source={{ uri: photo.displayUri }}
              style={styles.photo}
              contentFit={single ? "contain" : "cover"}
              accessibilityLabel={
                `${photoLabel ?? copy.treatment.doctorPhotoAccessibilityLabel} ` +
                `${photoIndex + 1}`
              }
              onLoad={({ source }) => {
                if (source.width > 0 && source.height > 0) {
                  setAspectRatio(source.width / source.height);
                }
                setStatus("ready");
              }}
              onError={() => setStatus("error")}
            />
          </Pressable>
        ) : null}

        {status === "loading" ? (
          <View
            pointerEvents="none"
            style={[styles.imageState, { backgroundColor: colors.surface }]}
          >
            <ActivityIndicator color={colors.accent} />
            <AppText variant="caption" tone="secondary">
              {copy.treatment.photoLoading}
            </AppText>
          </View>
        ) : null}

        {status === "error" ? (
          <View style={styles.imageState}>
            <AppIcon
              name="images-outline"
              size={32}
              color={colors.textSecondary}
            />

            <AppText
              variant="caption"
              tone="secondary"
              style={styles.stateText}
            >
              {copy.treatment.photoLoadError}
            </AppText>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setStatus("loading");
                setAttempt((value) => value + 1);
              }}
              style={({ pressed }) => [
                styles.retryButton,
                {
                  borderColor: colors.accent,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <AppText variant="button" style={{ color: colors.accent }}>
                {copy.treatment.retry}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function DoctorPhotoPager({ items, photoLabel }: DoctorPhotoPagerProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <View style={styles.grid}>
        {items.map((photo, photoIndex) => (
          <PhotoSlide
            key={`${photo.id}:${photo.displayUri}`}
            photo={photo}
            photoIndex={photoIndex}
            photoLabel={photoLabel}
            single={items.length === 1}
            onOpen={() => setViewerIndex(photoIndex)}
          />
        ))}
      </View>

      <AppText variant="caption" tone="secondary" style={styles.stateText}>
        {copy.treatment.photoOpenHint}
      </AppText>
      {viewerIndex !== null && items[viewerIndex] ? (
        <DoctorPhotoViewer
          items={items}
          photoLabel={photoLabel}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: theme.spacing.sm,
  },
  thumbnail: {
    width: "48.5%",
    aspectRatio: 1,
  },
  frame: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  imageState: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  stateText: {
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
