import { StyleSheet, View } from "react-native";

import { NotificationBell } from "@/modules/notifications/presentation/notification-bell";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import { AppText } from "./app-text";
import { BrandLogo } from "./brand-logo";
import { Stack } from "./stack";

type TabScreenHeaderProps = {
  title: string;
  subtitle: string;
};

export function TabScreenHeader({ title, subtitle }: TabScreenHeaderProps) {
  return (
    <Stack gap="lg">
      <View style={styles.brandRow}>
        <View style={styles.brand}>
          <BrandLogo />
          <AppText variant="brand" style={styles.brandName}>
            {copy.brand.name}
          </AppText>
        </View>
        <NotificationBell />
      </View>
      <Stack gap="xs">
        <AppText variant="display" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="body" tone="secondary">
          {subtitle}
        </AppText>
      </Stack>
    </Stack>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  brand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  brandName: {
    flexShrink: 1,
  },
});
