import { Redirect, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { AppState, Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { resolveAuthGate, signOut, useAuthSession } from "@/core/auth";
import { getSharedRemotePatientContextResolver } from "@/core/auth/shared-remote-patient-context";
import { shouldUseRemoteRepositories } from "@/core/runtime/should-use-remote-repositories";
import { getSharedSupabaseClient } from "@/core/supabase/client";
import {
  createRealtimeSubscriber,
  flushSubscribedTargets,
  useCanonicalInvalidation,
} from "@/core/sync";
import type { RealtimeSubscriberClient } from "@/core/sync/realtime-subscriber";
import { flushRegisteredRemoteOutboxes } from "@/core/sync/remote-outbox-flush";
import {
  loadSharedTreatmentShell,
  type TreatmentShell,
} from "@/modules/feedback";
import { sharedTreatmentRepository } from "@/modules/treatment/infrastructure";
import { copy } from "@/shared/copy";
import {
  AndroidBrandedSplashOverlay,
  shouldShowAndroidBrandedSplash,
} from "@/shared/launch/android-branded-splash";
import { theme } from "@/shared/theme";
import { Screen, ScreenState } from "@/shared/ui";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "expo-font";

// Keep native splash until RootLayout hides it (required before first render).
void SplashScreen.preventAutoHideAsync();

function LoadingScreen({ message }: { message: string }) {
  return (
    <Screen style={{ padding: theme.spacing.md }}>
      <ScreenState message={message} />
    </Screen>
  );
}

function ClinicalStack() {
  const [shell, setShell] = useState<TreatmentShell | { status: "loading" }>({
    status: "loading",
  });

  const refreshShell = useCallback(async () => {
    const next = await loadSharedTreatmentShell();
    setShell(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadSharedTreatmentShell().then((next) => {
      if (!cancelled) {
        setShell(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useCanonicalInvalidation("treatment-shell", refreshShell);

  if (shell.status === "loading") {
    return <LoadingScreen message={copy.completion.loading} />;
  }

  const treatmentCompleted = shell.status === "completed";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!treatmentCompleted}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="treatment/[milestoneId]"
          options={{
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="photo-capture"
          options={{
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
            animation: "fade",
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={treatmentCompleted}>
        <Stack.Screen name="completed" />
      </Stack.Protected>
    </Stack>
  );
}

function AccessGate() {
  const segments = useSegments();
  const onInvite = segments[0] === "invite";
  const onAccess = segments[0] === "access";

  return (
    <>
      {onInvite || onAccess ? null : <Redirect href="/access" />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="access" />
        <Stack.Screen name="invite/[token]" />
      </Stack>
    </>
  );
}

function LinkedClinicalShell() {
  const auth = useAuthSession();
  const resolver = getSharedRemotePatientContextResolver();
  const [link, setLink] = useState<"loading" | "ready">(
    resolver === null ? "ready" : "loading",
  );

  useEffect(() => {
    if (auth.status !== "authenticated" || resolver === null) {
      return;
    }

    let cancelled = false;
    void resolver.resolve().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.status === "unlinked") {
        void signOut();
        return;
      }
      setLink("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [auth, resolver]);

  if (link === "loading") {
    return <LoadingScreen message={copy.access.loading} />;
  }

  return (
    <>
      <RemoteRealtimeBridge />
      <ClinicalStack />
    </>
  );
}

function RemoteRealtimeBridge() {
  const auth = useAuthSession();

  useEffect(() => {
    const subscriber = createRealtimeSubscriber({
      client:
        getSharedSupabaseClient() as unknown as RealtimeSubscriberClient | null,
      shouldSubscribe: () => shouldUseRemoteRepositories(),
      resolveTreatmentId: async () => {
        const treatment = await sharedTreatmentRepository.getActiveTreatment();
        return treatment?.id ?? null;
      },
      onForeground: async () => {
        await flushRegisteredRemoteOutboxes();
        await flushSubscribedTargets();
      },
      appState: AppState,
    });
    subscriber.start();
    return () => {
      subscriber.stop();
    };
  }, [auth]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const auth = useAuthSession();
  const gate = resolveAuthGate(auth, __DEV__);
  const [androidBrandedSplashVisible, setAndroidBrandedSplashVisible] =
    useState(shouldShowAndroidBrandedSplash);

  const dismissAndroidBrandedSplash = useCallback(() => {
    setAndroidBrandedSplashVisible(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hideNativeSplash() {
      // DEV-only: hold native splash ~2s to preview design (existing behavior).
      if (__DEV__) {
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      }
      if (!cancelled) {
        await SplashScreen.hideAsync();
      }
    }

    void hideNativeSplash();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  let content;
  if (gate.screen === "loading") {
    content = <LoadingScreen message={copy.access.loading} />;
  } else if (gate.screen === "access") {
    content = <AccessGate />;
  } else {
    content = <LinkedClinicalShell />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      {content}
      {Platform.OS === "android" && androidBrandedSplashVisible ? (
        <AndroidBrandedSplashOverlay onFinished={dismissAndroidBrandedSplash} />
      ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
