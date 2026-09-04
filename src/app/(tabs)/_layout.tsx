import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

import { copy } from "@/shared/copy";
import { getColors } from "@/shared/theme";

export default function TabsLayout() {
  const colors = getColors(useColorScheme());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIconStyle: { display: "none" },
        tabBarStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.today,
        }}
      />
      <Tabs.Screen
        name="treatment"
        options={{
          title: copy.tabs.treatment,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: copy.tabs.diary,
        }}
      />
    </Tabs>
  );
}
