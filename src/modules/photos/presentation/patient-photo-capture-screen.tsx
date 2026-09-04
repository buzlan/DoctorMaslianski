import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useColorScheme } from "react-native";

import { sharedPatientPhotoLoader } from "@/modules/photos/application";
import type { CapturedImage } from "@/modules/photos/domain";
import { copy } from "@/shared/copy";
import { loadCivilTodayDate } from "@/shared/date/load-civil-today-date";
import { getColors, theme } from "@/shared/theme";
import { AppText, Button, Screen, Stack } from "@/shared/ui";

export function PatientPhotoCaptureScreen() {
  const colors = getColors(useColorScheme());
  const router = useRouter();
  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const confirmingRef = useRef(false);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/");
  }

  async function capture(kind: "camera" | "library") {
    setMessage(null);
    const result =
      kind === "camera"
        ? await sharedPatientPhotoLoader.captureFromCamera()
        : await sharedPatientPhotoLoader.pickFromLibrary();

    if (result.status === "cancelled") {
      return;
    }
    if (result.status === "permission_denied") {
      setCaptured(null);
      setMessage(copy.photos.permissionDenied);
      return;
    }
    if (result.status === "unavailable") {
      setCaptured(null);
      setMessage(
        kind === "camera"
          ? copy.photos.cameraUnavailable
          : copy.photos.confirmError,
      );
      return;
    }
    setCaptured(result.image);
  }

  async function confirm() {
    if (captured === null || confirmingRef.current) {
      return;
    }
    confirmingRef.current = true;
    setConfirming(true);
    setMessage(null);

    try {
      const result = await sharedPatientPhotoLoader.confirm(
        await loadCivilTodayDate(),
        captured,
      );
      if (result.status === "recorded") {
        goBack();
        return;
      }
      if (result.status === "ignored" && result.reason === "daily_cap_reached") {
        setMessage(copy.photos.dailyCap);
        return;
      }
      if (result.status === "ignored" && result.reason === "invalid_source") {
        setMessage(copy.photos.invalidSource);
        return;
      }
      if (result.status === "ignored" && result.reason === "no_active_treatment") {
        setMessage(copy.photos.noActiveTreatment);
        return;
      }
      setMessage(copy.photos.confirmError);
    } finally {
      confirmingRef.current = false;
      setConfirming(false);
    }
  }

  return (
    <Screen edges={["top", "left", "right"]} style={styles.content}>
      <Stack gap="md" style={styles.body}>
        <AppText variant="title">{copy.photos.title}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.photos.back}
          onPress={goBack}
        >
          <AppText style={{ color: colors.accent }}>{copy.photos.back}</AppText>
        </Pressable>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <Stack gap="md">
            {message !== null ? (
              <AppText tone="secondary">{message}</AppText>
            ) : null}
            {captured !== null ? (
              <Image
                source={{ uri: captured.sourceUri }}
                style={styles.preview}
                contentFit="contain"
                accessibilityLabel={copy.photos.title}
              />
            ) : null}
            <Button
              label={copy.photos.takePhoto}
              disabled={confirming}
              onPress={() => {
                void capture("camera");
              }}
            />
            <Button
              label={copy.photos.chooseFromLibrary}
              disabled={confirming}
              onPress={() => {
                void capture("library");
              }}
            />
            {captured !== null ? (
              <Button
                label={copy.photos.retry}
                disabled={confirming}
                onPress={() => {
                  setCaptured(null);
                  setMessage(null);
                }}
              />
            ) : null}
            {captured !== null ? (
              <Button
                label={copy.photos.confirm}
                disabled={confirming}
                onPress={() => {
                  void confirm();
                }}
              />
            ) : null}
          </Stack>
        </ScrollView>
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
  preview: {
    width: "100%",
    height: 280,
    backgroundColor: "transparent",
  },
});
