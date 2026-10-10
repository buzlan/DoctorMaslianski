import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { NotificationBell } from "@/modules/notifications/presentation/notification-bell";
import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import { AppText } from "./app-text";
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
          <Image
            source={require("../../../assets/images/patient/medical-logo.svg")}
            style={styles.logo}
            resizeMode="contain"
            accessible={false}
          />
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
  logo: { width: 44, height: 44 },
  brandName: {
    flexShrink: 1,
  },
});
