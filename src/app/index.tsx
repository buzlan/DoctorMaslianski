import { StyleSheet } from "react-native";

import { AppText, Screen, Stack } from "@/shared/ui";

export default function HomeScreen() {
  return (
    <Screen style={styles.content}>
      <Stack>
        <AppText variant="title">Doctor Maslianski</AppText>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
});
