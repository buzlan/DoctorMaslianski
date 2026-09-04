import { useEffect, useState } from "react";
import { Stack } from "expo-router";

import { resolveAuthGate, useAuthSession } from "@/core/auth";
import {
  loadSharedTreatmentShell,
  type TreatmentShell,
} from "@/modules/feedback";
import { copy } from "@/shared/copy";
import { AppText, Screen } from "@/shared/ui";

function LoadingScreen({ message }: { message: string }) {
  return (
    <Screen>
      <AppText>{message}</AppText>
    </Screen>
  );
}

function ClinicalStack() {
  const [shell, setShell] = useState<TreatmentShell | { status: "loading" }>({
    status: "loading",
  });

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

  if (shell.status === "loading") {
    return <LoadingScreen message={copy.completion.loading} />;
  }

  const treatmentCompleted = shell.status === "completed";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!treatmentCompleted}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="treatment/[milestoneId]" />
        <Stack.Screen name="photo-capture" />
      </Stack.Protected>
      <Stack.Protected guard={treatmentCompleted}>
        <Stack.Screen name="completed" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const auth = useAuthSession();
  const gate = resolveAuthGate(auth, __DEV__);

  if (gate.screen === "loading") {
    return <LoadingScreen message={copy.access.loading} />;
  }

  if (gate.screen === "access") {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard>
          <Stack.Screen name="access" />
        </Stack.Protected>
      </Stack>
    );
  }

  return <ClinicalStack />;
}
