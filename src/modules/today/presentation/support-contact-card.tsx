import { useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Card, Stack } from "@/shared/ui";

const CONTACTS_URL = "https://maslianski.by/#contacts";

function isAllowedUrl(url: string): boolean {
  return url.startsWith("https://");
}

async function openContactForm(): Promise<boolean> {
  if (!isAllowedUrl(CONTACTS_URL)) {
    return false;
  }

  try {
    await Linking.openURL(CONTACTS_URL);
    return true;
  } catch {
    return false;
  }
}

export function SupportContactCard() {
  const colors = getColors(useColorScheme());
  const [openFailed, setOpenFailed] = useState(false);

  function handlePress() {
    setOpenFailed(false);

    void openContactForm().then((opened) => {
      if (!opened) {
        setOpenFailed(true);
      }
    });
  }

  return (
    <Stack gap="xs">
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={copy.supportContact.accessibilityLabel}
        accessibilityHint={copy.supportContact.accessibilityHint}
        onPress={handlePress}
        style={({ pressed }) => [{ opacity: pressed ? 0.84 : 1 }]}
      >
        <Card variant="tinted" style={styles.card}>
          <View style={styles.row}>
            <View
              style={[
                styles.infoIcon,
                {
                  backgroundColor: colors.accentSoft,
                  borderColor: colors.accent,
                },
              ]}
            >
              <AppText style={{ color: colors.accent, fontWeight: "700" }}>
                i
              </AppText>
            </View>

            <View style={styles.copy}>
              <AppText variant="title">{copy.supportContact.title}</AppText>
              <AppText variant="caption" tone="secondary">
                {copy.supportContact.subtitle}
              </AppText>
            </View>

            <AppText
              variant="title"
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{ color: colors.accent }}
            >
              ›
            </AppText>
          </View>
        </Card>
      </Pressable>

      {openFailed ? (
        <AppText tone="secondary">{copy.supportContact.openError}</AppText>
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  infoIcon: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
});
