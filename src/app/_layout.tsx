import { useEffect, useState } from "react";
import { Stack } from "expo-router";

import {
  loadSharedTreatmentShell,
  type TreatmentShell,
} from "@/modules/feedback";
import { copy } from "@/shared/copy";
import { AppText, Screen } from "@/shared/ui";

export default function RootLayout() {
  const [shell, setShell] = useState<TreatmentShell | { status: "loading" }>({
    status: "loading",
  });

  useEffect(() => {
    void loadSharedTreatmentShell().then(setShell);
  }, []);

  if (shell.status === "loading") {
    return (
      <Screen>
        <AppText>{copy.completion.loading}</AppText>
      </Screen>
    );
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
