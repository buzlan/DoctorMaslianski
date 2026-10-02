import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { applySession, useAuthSession } from "@/core/auth";
import { getSharedSupabaseClient } from "@/core/supabase/client";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import { AppText, Button, Screen, Stack } from "@/shared/ui";

import { clearBrowserHandoffCookie, readBrowserHandoffCookie } from "../handoff-cookie";
import { consumeWebSessionHandoff } from "../handoff-api";
import { isRunningAsInstalledWebApp } from "../installed-web-app";
import { planInstalledSessionRestore } from "../restore-plan";
import { restoreInstalledSession } from "../restore-installed-session";

type GatePhase = "checking" | "ready" | "failed";

function HandoffFallback({ onOpenInvite }: { onOpenInvite: () => void }) {
  return (
    <Screen style={{ padding: theme.spacing.md }}>
      <Stack gap="md">
        <AppText variant="title" accessibilityRole="header">
          {copy.pwa.handoffFailedTitle}
        </AppText>
        <AppText tone="secondary">{copy.pwa.handoffFailedBody}</AppText>
        <Button label={copy.pwa.handoffFailedAction} variant="primary" onPress={onOpenInvite} />
      </Stack>
    </Screen>
  );
}

export function InstalledWebSessionGate({ children }: { children: ReactNode }) {
  const auth = useAuthSession();
  const router = useRouter();
  const started = useRef(false);
  const [openedAccess, setOpenedAccess] = useState(false);
  const [consumePhase, setConsumePhase] = useState<"pending" | "ready" | "failed">("pending");
  const installed = Platform.OS === "web" && isRunningAsInstalledWebApp();
  const handoffToken = installed ? readBrowserHandoffCookie() : null;
  const plan = planInstalledSessionRestore({
    installed,
    authStatus: auth.status,
    handoffToken,
  });
  const consumeToken = plan.type === "consume" ? plan.token : null;

  useEffect(() => {
    if (consumeToken === null || started.current) {
      return;
    }
    started.current = true;

    void restoreInstalledSession(consumeToken, {
      consume: async (token) => {
        const client = getSharedSupabaseClient();
        if (client === null) {
          return { status: "retryable" };
        }
        return consumeWebSessionHandoff(client, token);
      },
      apply: applySession,
    }).then((result) => {
      if (result === "retryable") {
        setConsumePhase("failed");
        return;
      }
      clearBrowserHandoffCookie();
      if (result === "restored") {
        router.replace("/");
        setConsumePhase("ready");
        return;
      }
      setConsumePhase("failed");
    });
  }, [consumeToken, router]);

  let phase: GatePhase = "ready";
  if (plan.type === "wait" || (plan.type === "consume" && consumePhase === "pending")) {
    phase = "checking";
  } else if (
    plan.type === "missing" ||
    (plan.type === "consume" && consumePhase === "failed")
  ) {
    phase = "failed";
  }

  if (phase === "checking") {
    return (
      <Screen style={{ padding: theme.spacing.md }}>
        <AppText>{copy.access.loading}</AppText>
      </Screen>
    );
  }

  if (phase === "failed" && !openedAccess) {
    return (
      <HandoffFallback
        onOpenInvite={() => {
          setOpenedAccess(true);
        }}
      />
    );
  }

  return children;
}
