import { StyleSheet } from "react-native";

import { copy } from "@/shared/copy";
import { theme } from "@/shared/theme";
import { AppText, Screen, Stack } from "@/shared/ui";

export default function TodayScreen() {
  return (
    <Screen edges={["top", "left", "right"]} style={styles.content}>
      <Stack gap="md">
        <AppText variant="title">{copy.today.title}</AppText>
        <AppText tone="secondary">{copy.today.body}</AppText>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
  },
});
