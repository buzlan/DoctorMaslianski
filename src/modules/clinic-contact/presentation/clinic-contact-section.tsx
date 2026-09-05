import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import { AppText, Button, Card, IconWell, Stack } from "@/shared/ui";

import {
  clinicContactChannels,
  hasClinicContactChannel,
  type ClinicContact,
  type ClinicContactChannel,
} from "../domain";

function isAllowlistedHref(href: string): boolean {
  return (
    href.startsWith("tel:") ||
    href.startsWith("mailto:") ||
    href.startsWith("https:") ||
    href.startsWith("http:")
  );
}

function channelLabel(kind: ClinicContactChannel["kind"]): string {
  if (kind === "phone") {
    return copy.clinicContact.call;
  }
  if (kind === "email") {
    return copy.clinicContact.email;
  }
  return copy.clinicContact.book;
}

async function openAllowlistedHref(href: string): Promise<boolean> {
  if (!isAllowlistedHref(href)) {
    return false;
  }

  try {
    const canOpen = await Linking.canOpenURL(href);
    if (!canOpen) {
      return false;
    }
    await Linking.openURL(href);
    return true;
  } catch {
    return false;
  }
}

export function ClinicContactSection({ contact }: { contact: ClinicContact }) {
  const [openFailed, setOpenFailed] = useState(false);
  const channels = clinicContactChannels(contact);

  if (!hasClinicContactChannel(contact)) {
    return (
      <Card variant="elevated">
        <Stack gap="sm">
          <View style={styles.header}>
            <IconWell name="call-outline" />
            <AppText variant="title" style={styles.headerCopy}>
              {copy.clinicContact.label}
            </AppText>
          </View>
          <AppText tone="secondary">{copy.clinicContact.unavailable}</AppText>
        </Stack>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <Stack gap="md">
        <View style={styles.header}>
          <IconWell name="call-outline" />
          <AppText variant="title" style={styles.headerCopy}>
            {copy.clinicContact.label}
          </AppText>
        </View>
        {channels.map((channel) => (
          <Button
            key={channel.kind}
            variant="secondary"
            label={channelLabel(channel.kind)}
            accessibilityLabel={channelLabel(channel.kind)}
            onPress={() => {
              void openAllowlistedHref(channel.href).then((opened) => {
                if (!opened) {
                  setOpenFailed(true);
                }
              });
            }}
          />
        ))}
        {openFailed ? (
          <AppText tone="secondary">{copy.clinicContact.openError}</AppText>
        ) : null}
      </Stack>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
});
