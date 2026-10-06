import { createElement, useState } from "react";
import { createPortal } from "react-dom";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

import { getSharedSupabaseClient } from "@/core/supabase/client";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import { AppText, Button, Card, Stack } from "@/shared/ui";

import { writeBrowserHandoffCookie } from "../handoff-cookie";
import { createWebSessionHandoff } from "../handoff-api";
import {
  isIosBrowser,
  isIosSafari,
  readInstallDismissed,
  shouldShowHomeScreenInstallOffer,
  snoozeInstallOffer,
  writeInstallDismissed,
  type InstallDismissStorage,
} from "../install-offer";
import { completeInstallPrompt, takeInstallPrompt } from "../install-prompt";
import { isRunningAsInstalledWebApp } from "../installed-web-app";
import { prepareIosHandoff } from "../prepare-ios-handoff";

type OfferStep = "offer" | "preparing" | "ios" | "manual" | "error";

function browserStorage(): InstallDismissStorage | null {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      return null;
    }
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function ShareMark() {
  const color = theme.colors.light.accent;
  return createElement(
    "svg",
    {
      width: 22,
      height: 22,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
    },
    createElement("path", { d: "M12 4v10" }),
    createElement("path", { d: "M8.5 7.5 12 4l3.5 3.5" }),
    createElement("path", { d: "M6 12.5V19h12v-6.5" }),
  );
}

export function HomeScreenInstallOffer() {
  const storage = browserStorage();
  const [dismissed, setDismissed] = useState(() => readInstallDismissed(storage));
  const [sessionHidden, setSessionHidden] = useState(false);
  const [step, setStep] = useState<OfferStep>("offer");

  const installed = isRunningAsInstalledWebApp();
  const visible = shouldShowHomeScreenInstallOffer({
    web: Platform.OS === "web",
    installed,
    dismissed,
    todayStable: true,
  });

  if (!visible || sessionHidden || typeof document === "undefined") {
    return null;
  }

  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const touchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints;
  const ios = isIosBrowser(userAgent, touchPoints);
  const safari = isIosSafari(userAgent, touchPoints);

  async function onAdd() {
    if (ios) {
      setStep("preparing");
      const prepared = await prepareIosHandoff({
        create: async () => {
          const client = getSharedSupabaseClient();
          if (client === null) {
            return { status: "failed" };
          }
          return createWebSessionHandoff(client);
        },
        writeCookie: writeBrowserHandoffCookie,
      });
      setStep(prepared === "ready" ? "ios" : "error");
      return;
    }

    const outcome = await completeInstallPrompt(takeInstallPrompt());
    if (outcome === "accepted") {
      writeInstallDismissed(storage);
      setDismissed(true);
      return;
    }
    if (outcome === "dismissed") {
      setSessionHidden(true);
      return;
    }
    setStep("manual");
  }

  function onLater() {
    snoozeInstallOffer(storage);
    setSessionHidden(true);
  }

  function onAlreadyInstalled() {
    writeInstallDismissed(storage);
    setDismissed(true);
  }

  const overlay = (
    <View style={styles.backdrop}>
      <Card style={styles.card}>
        <Stack gap="md">
          <AppText variant="title" accessibilityRole="header">
            {copy.pwa.installTitle}
          </AppText>
          <AppText tone="secondary">{copy.pwa.installBody}</AppText>
          {step === "ios" ? (
            <Stack gap="sm">
              {copy.pwa.iosSteps.map((line, index) => (
                <View key={line} style={styles.stepRow}>
                  {index === 0 ? <ShareMark /> : (
                    <AppText variant="label" style={styles.stepIndex}>
                      {index + 1}
                    </AppText>
                  )}
                  <AppText style={styles.stepText}>{line}</AppText>
                </View>
              ))}
              {safari ? null : <AppText tone="secondary">{copy.pwa.iosOtherBrowser}</AppText>}
            </Stack>
          ) : null}
          {step === "manual" ? <AppText tone="secondary">{copy.pwa.androidManual}</AppText> : null}
          {step === "error" ? <AppText tone="secondary">{copy.pwa.prepareError}</AppText> : null}
          {step === "ios" || step === "manual" ? (
            <Button
              label={copy.pwa.close}
              variant="secondary"
              onPress={() => {
                setSessionHidden(true);
              }}
            />
          ) : (
            <Stack gap="sm">
              <Button
                label={copy.pwa.add}
                variant="primary"
                disabled={step === "preparing"}
                onPress={() => {
                  void onAdd();
                }}
              />
              <Button label={copy.pwa.later} variant="secondary" onPress={onLater} />
            </Stack>
          )}
          <Button
            label={copy.pwa.alreadyAdded}
            variant="secondary"
            disabled={step === "preparing"}
            onPress={onAlreadyInstalled}
          />
        </Stack>
      </Card>
    </View>
  );

  return createPortal(overlay, document.body);
}

const styles = StyleSheet.create({
  backdrop: {
    position: "fixed",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "flex-end",
    padding: theme.spacing.md,
    paddingBottom: 96,
    backgroundColor: "rgba(27, 36, 48, 0.28)",
    zIndex: 40,
  } as ViewStyle,
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  stepIndex: {
    width: 22,
    textAlign: "center",
    color: theme.colors.light.accent,
  },
  stepText: {
    flex: 1,
  },
});
