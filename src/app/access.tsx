import { resolveAuthGate, useAuthSession } from "@/core/auth";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import { AppText, Screen, Stack } from "@/shared/ui";

export default function AccessScreen() {
  const auth = useAuthSession();
  const gate = resolveAuthGate(auth, __DEV__);
  const reason =
    gate.screen === "access" ? gate.reason : "authentication_required";
  const text =
    reason === "service_unavailable"
      ? copy.access.serviceUnavailable
      : copy.access.authenticationRequired;

  return (
    <Screen style={{ padding: theme.spacing.lg }}>
      <Stack gap="md">
        <AppText variant="title">{text.title}</AppText>
        <AppText tone="secondary">{text.body}</AppText>
      </Stack>
    </Screen>
  );
}
