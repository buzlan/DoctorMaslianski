import { Tabs } from "expo-router";
import { StyleSheet, useColorScheme, type ColorValue } from "react-native";

import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppIcon, type AppIconName } from "@/shared/ui";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function tabIcon(
  focused: boolean,
  color: ColorValue,
  outline: AppIconName,
  filled: AppIconName,
) {
  return <AppIcon name={focused ? filled : outline} color={color} size={24} />;
}

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const insets = useSafeAreaInsets();
  const androidBottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarActiveBackgroundColor:
          scheme === "dark" ? colors.accentSoft : "#E8F2FF",
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: theme.spacing.md,
          ...(Platform.OS === "android"
            ? {
                height: 64 + androidBottomPadding,
                paddingBottom: androidBottomPadding,
              }
            : {}),
        },
        tabBarItemStyle: {
          marginHorizontal: theme.spacing.lg,
          marginVertical: theme.spacing.xs,
          borderRadius: theme.radii.lg,
          paddingVertical: theme.spacing.xs,
          overflow: "hidden",
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontWeight: "normal",
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.today,
          tabBarIcon: ({ color, focused }) =>
            tabIcon(focused, color, "home-outline", "home"),
        }}
      />
      <Tabs.Screen
        name="treatment"
        options={{
          title: copy.tabs.treatment,
          tabBarIcon: ({ color, focused }) =>
            tabIcon(focused, color, "clipboard-outline", "clipboard"),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: copy.tabs.diary,
          tabBarIcon: ({ color, focused }) =>
            tabIcon(focused, color, "book-outline", "book"),
        }}
      />
    </Tabs>
  );
}
