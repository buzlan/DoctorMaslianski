import { useEffect, useState } from "react";
import { Redirect, Stack, useSegments } from "expo-router";

import { resolveAuthGate, signOut, useAuthSession } from "@/core/auth";
import { getSharedRemotePatientContextResolver } from "@/core/auth/shared-remote-patient-context";
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

  return <ClinicalStack />;
}

export default function RootLayout() {
  const auth = useAuthSession();
  const gate = resolveAuthGate(auth, __DEV__);

  if (gate.screen === "loading") {
    return <LoadingScreen message={copy.access.loading} />;
  }

  if (gate.screen === "access") {
    return <AccessGate />;
  }

  return <LinkedClinicalShell />;
}
