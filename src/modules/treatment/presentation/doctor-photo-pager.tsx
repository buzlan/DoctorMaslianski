import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import type { MilestoneDoctorPhotoItem } from "@/modules/treatment/application";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppIcon, AppText, Stack } from "@/shared/ui";

type DoctorPhotoPagerProps = {
  items: readonly MilestoneDoctorPhotoItem[];
};

type PhotoSlideProps = {
  photo: MilestoneDoctorPhotoItem;
  photoIndex: number;
  width: number;
  height: number;
};

function PhotoSlide({ photo, photoIndex, width, height }: PhotoSlideProps) {
  const colors = getColors(useColorScheme());

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);

  return (
    <View style={{ width, height }}>
      <View
        style={[
          styles.frame,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {status !== "error" ? (
          <Image
            key={attempt}
            source={{ uri: photo.displayUri }}
            style={styles.photo}
            contentFit="contain"
            accessibilityLabel={
              `${copy.treatment.doctorPhotoAccessibilityLabel} ` +
              `${photoIndex + 1}`
            }
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
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

export function DoctorPhotoPager({ items }: DoctorPhotoPagerProps) {
  const colors = getColors(useColorScheme());
  const { height: windowHeight } = useWindowDimensions();

  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);

  const hasMultiplePhotos = items.length > 1;
  const hasPrevious = index > 0;
  const hasNext = index < items.length - 1;

  const photoHeight =
    width > 0
      ? Math.max(220, Math.min(width * 1.15, windowHeight * 0.55))
      : 280;

  useEffect(() => {
    if (width <= 0) {
      return;
    }

    scrollRef.current?.scrollTo({
      x: indexRef.current * width,
      animated: false,
    });
  }, [width]);

  function updateIndex(next: number) {
    const safeIndex = Math.max(0, Math.min(next, items.length - 1));

    indexRef.current = safeIndex;
    setIndex(safeIndex);
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width <= 0) {
      return;
    }

    updateIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  function goToPhoto(next: number) {
    if (width <= 0 || next < 0 || next >= items.length) {
      return;
    }

    scrollRef.current?.scrollTo({
      x: next * width,
      animated: true,
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <View
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width);
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          scrollEnabled={hasMultiplePhotos}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ height: photoHeight }}
        >
          {width > 0
            ? items.map((photo, photoIndex) => (
                <PhotoSlide
                  key={`${photo.id}:${photo.displayUri}`}
                  photo={photo}
                  photoIndex={photoIndex}
                  width={width}
                  height={photoHeight}
                />
              ))
            : null}
        </ScrollView>
      </View>

      {hasMultiplePhotos ? (
        <View style={styles.navigation}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.treatment.previousPhoto}
            accessibilityState={{ disabled: !hasPrevious }}
            disabled={!hasPrevious}
            onPress={() => goToPhoto(index - 1)}
            style={({ pressed }) => [
              styles.arrowButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: !hasPrevious ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <AppIcon name="chevron-left" size={20} color={colors.accent} />
          </Pressable>

          <AppText
            variant="body"
            tone="secondary"
            accessibilityLiveRegion="polite"
          >
            {index + 1} {copy.treatment.photoCounterOf} {items.length}
          </AppText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.treatment.nextPhoto}
            accessibilityState={{ disabled: !hasNext }}
            disabled={!hasNext}
            onPress={() => goToPhoto(index + 1)}
            style={({ pressed }) => [
              styles.arrowButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: !hasNext ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <AppIcon name="chevron-right" size={20} color={colors.accent} />
          </Pressable>
        </View>
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
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
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
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
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
