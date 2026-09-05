import { Tabs } from "expo-router";
import { StyleSheet, useColorScheme, View, type ColorValue } from "react-native";

import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppIcon, type AppIconName } from "@/shared/ui";

function tabIcon(
  focused: boolean,
  color: ColorValue,
  outline: AppIconName,
  filled: AppIconName,
  wellColor: string,
) {
  return (
    <View
      style={[
        styles.iconWell,
        focused ? { backgroundColor: wellColor } : undefined,
      ]}
    >
      <AppIcon name={focused ? filled : outline} color={color} size={20} />
    </View>
  );
}

export default function TabsLayout() {
  const colors = getColors(useColorScheme());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
          paddingBottom: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.today,
          tabBarIcon: ({ color, focused }) =>
            tabIcon(focused, color, "home-outline", "home", colors.accentSoft),
        }}
      />
      <Tabs.Screen
        name="treatment"
        options={{
          title: copy.tabs.treatment,
          tabBarIcon: ({ color, focused }) =>
            tabIcon(
              focused,
              color,
              "clipboard-outline",
              "clipboard",
              colors.accentSoft,
            ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: copy.tabs.diary,
          tabBarIcon: ({ color, focused }) =>
            tabIcon(focused, color, "book-outline", "book", colors.accentSoft),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWell: {
    width: 36,
    height: 28,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
