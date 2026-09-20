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

function isAllowedUrl(url: string): boolean {
  return url.startsWith("https://");
}

function openContactForm(url: string): void {
  if (!isAllowedUrl(url)) {
    return;
  }

  void Linking.openURL(url).catch(() => undefined);
}

export function SupportContactCard({ bookingUrl }: { bookingUrl?: string }) {
  const colors = getColors(useColorScheme());

  const canOpenContactForm =
    bookingUrl !== undefined && isAllowedUrl(bookingUrl);

  function handlePress() {
    if (!canOpenContactForm || bookingUrl === undefined) {
      return;
    }

    openContactForm(bookingUrl);
  }

  const card = (
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

        {canOpenContactForm ? (
          <AppText
            variant="title"
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={{ color: colors.accent }}
          >
            ›
          </AppText>
        ) : null}
      </View>
    </Card>
  );

  return (
    <Stack gap="xs">
      {canOpenContactForm ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={copy.supportContact.accessibilityLabel}
          accessibilityHint={copy.supportContact.accessibilityHint}
          onPress={handlePress}
          style={({ pressed }) => [{ opacity: pressed ? 0.84 : 1 }]}
        >
          {card}
        </Pressable>
      ) : (
        card
      )}

      {!canOpenContactForm ? (
        <AppText tone="secondary">{copy.supportContact.unavailable}</AppText>
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
