import { useState } from "react";
import { Linking } from "react-native";

import { copy } from "@/shared/copy";
import { AppText, Button, Stack } from "@/shared/ui";

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
      <Stack gap="xs">
        <AppText variant="caption" tone="secondary">
          {copy.clinicContact.label}
        </AppText>
        <AppText tone="secondary">{copy.clinicContact.unavailable}</AppText>
      </Stack>
    );
  }

  return (
    <Stack gap="xs">
      <AppText variant="caption" tone="secondary">
        {copy.clinicContact.label}
      </AppText>
      {channels.map((channel) => (
        <Button
          key={channel.kind}
          label={channelLabel(channel.kind)}
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
  );
}
