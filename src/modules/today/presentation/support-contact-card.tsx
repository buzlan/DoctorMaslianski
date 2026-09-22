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
import { AppText, Card } from "@/shared/ui";

/** Real section id on maslianski.by for "Контакты и запись" / feedback form. */
export const CLINIC_CONTACTS_SECTION_ID = "contacts";

export const CLINIC_CONTACTS_URL =
  `https://maslianski.by/#${CLINIC_CONTACTS_SECTION_ID}` as const;

/** Compact sticky slot height used for ScrollView bottom padding. */
export const STICKY_CONTACT_CARD_HEIGHT = 80;
export const STICKY_CONTACT_SCROLL_PADDING =
  STICKY_CONTACT_CARD_HEIGHT + theme.spacing.md;

async function openClinicContactsUrl(): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(CLINIC_CONTACTS_URL);
    if (!canOpen) {
      return false;
    }
    await Linking.openURL(CLINIC_CONTACTS_URL);
    return true;
  } catch {
    return false;
  }
}

export function SupportContactCard() {
  const colors = getColors(useColorScheme());
  const [openFailed, setOpenFailed] = useState(false);

  async function handlePress() {
    setOpenFailed(false);
    const opened = await openClinicContactsUrl();
    if (!opened) {
      setOpenFailed(true);
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={copy.supportContact.accessibilityLabel}
        accessibilityHint={copy.supportContact.accessibilityHint}
        onPress={() => {
          void handlePress();
        }}
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
              <AppText variant="title" style={styles.title} numberOfLines={1}>
                {copy.supportContact.title}
              </AppText>
              <AppText
                variant="caption"
                tone="secondary"
                style={styles.subtitle}
                numberOfLines={2}
              >
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
        <AppText tone="secondary" style={styles.error}>
          {copy.supportContact.openError}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 0,
  },
  card: {
    minHeight: STICKY_CONTACT_CARD_HEIGHT,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  infoIcon: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    marginTop: theme.spacing.xs,
  },
});
