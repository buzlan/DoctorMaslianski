import { StyleSheet, Text, useColorScheme, View } from "react-native";

import { getColors, theme } from "@/shared/theme";

export default function HomeScreen() {
  const colors = getColors(useColorScheme());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Doctor Maslianski
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...theme.typography.title,
  },
});
