import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { sharedPatientPhotoLoader } from "@/modules/photos/application";
import type { CapturedImage } from "@/modules/photos/domain";
import { copy } from "@/shared/copy";
import { loadCivilTodayDate } from "@/shared/date/load-civil-today-date";
import { getColors, theme } from "@/shared/theme";
import {
  AppIcon,
  AppText,
  BackIconButton,
  Button,
  Card,
  IconWell,
  Screen,
  ScreenHeader,
  Stack,
  type AppIconName,
} from "@/shared/ui";

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

  function clearCaptured() {
    setCaptured(null);
    setMessage(null);
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
      if (result.status === "recorded" || result.status === "queued") {
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
        <BackIconButton
          accessibilityLabel={copy.photos.back}
          onPress={goBack}
        />
        {captured === null ? (
          <Stack gap="xs">
            <ScreenHeader title={copy.photos.title} />
            <AppText variant="title">{copy.photos.addPrompt}</AppText>
            <AppText tone="secondary">{copy.photos.addHint}</AppText>
          </Stack>
        ) : (
          <ScreenHeader
            title={copy.photos.title}
            subtitle={copy.photos.readySubtitle}
          />
        )}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Stack gap="md">
            {message !== null ? (
              <AppText tone="secondary">{message}</AppText>
            ) : null}
            {captured === null ? (
              <>
                <View style={styles.sourceRow}>
                  <SourceCard
                    icon="camera-outline"
                    title={copy.photos.takePhoto}
                    hint={copy.photos.takePhotoHint}
                    disabled={confirming}
                    onPress={() => {
                      void capture("camera");
                    }}
                  />
                  <SourceCard
                    icon="images-outline"
                    title={copy.photos.chooseFromLibrary}
                    hint={copy.photos.chooseFromLibraryHint}
                    disabled={confirming}
                    onPress={() => {
                      void capture("library");
                    }}
                  />
                </View>
                <Card variant="tinted">
                  <Stack gap="xs">
                    <AppText variant="title">{copy.photos.tipTitle}</AppText>
                    <AppText tone="secondary">{copy.photos.tipBody}</AppText>
                  </Stack>
                </Card>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.previewFrame,
                    {
                      backgroundColor: colors.accentSoft,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: captured.sourceUri }}
                    style={styles.preview}
                    contentFit="cover"
                    accessibilityLabel={copy.photos.title}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.photos.removePhoto}
                    disabled={confirming}
                    onPress={clearCaptured}
                    style={({ pressed }) => [
                      styles.trashButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <AppIcon
                      name="trash-outline"
                      color={colors.accent}
                      size={18}
                    />
                  </Pressable>
                </View>
                <AppText tone="secondary">{copy.photos.doctorAccessNote}</AppText>
                <Button
                  variant="primary"
                  label={copy.photos.confirm}
                  disabled={confirming}
                  onPress={() => {
                    void confirm();
                  }}
                />
              </>
            )}
          </Stack>
        </ScrollView>
      </Stack>
    </Screen>
  );
}

function SourceCard({
  icon,
  title,
  hint,
  disabled,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  hint: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sourceCardPressable,
        { opacity: pressed || disabled ? 0.82 : 1 },
      ]}
    >
      <Card variant="tinted" style={styles.sourceCard}>
        <Stack gap="sm">
          <IconWell name={icon} size={40} />
          <Stack gap="xs">
            <AppText variant="title">{title}</AppText>
            <AppText variant="caption" tone="secondary">
              {hint}
            </AppText>
          </Stack>
        </Stack>
      </Card>
    </Pressable>
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
    gap: theme.spacing.md,
  },
  sourceRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  sourceCardPressable: {
    flex: 1,
  },
  sourceCard: {
    flex: 1,
    minHeight: 148,
  },
  previewFrame: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: theme.radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  trashButton: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
