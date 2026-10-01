import { Slot, usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pressable, StyleSheet, useColorScheme, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { copy } from "@/shared/copy";
import { isDocumentScrollPath } from "@/shared/navigation/document-scroll-path";
import {
  initialTabBarScrollState,
  reduceTabBarScroll,
  TAB_BAR_ANIMATION_MS,
  TAB_BAR_IDLE_MS,
  webTabBarReserve,
  type TabBarScrollState,
} from "@/shared/navigation/tab-bar-scroll-visibility";
import { getColors, theme } from "@/shared/theme";
import { AppIcon, AppText, type AppIconName } from "@/shared/ui";
import { WebTabBarInsetContext } from "@/shared/ui/web-tab-bar-inset";

const TABS: {
  href: "/" | "/treatment" | "/diary";
  label: string;
  outline: AppIconName;
  filled: AppIconName;
}[] = [
  {
    href: "/",
    label: copy.tabs.today,
    outline: "home-outline",
    filled: "home",
  },
  {
    href: "/treatment",
    label: copy.tabs.treatment,
    outline: "clipboard-outline",
    filled: "clipboard",
  },
  {
    href: "/diary",
    label: copy.tabs.diary,
    outline: "book-outline",
    filled: "book",
  },
];

function useTabBarHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  const stateRef = useRef<TabBarScrollState>(initialTabBarScrollState());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const apply = (next: TabBarScrollState) => {
      const previous = stateRef.current;
      stateRef.current = next;
      if (previous.visibility !== next.visibility) {
        setHidden(next.visibility === "hidden");
      }
    };

    const onScroll = () => {
      const now = Date.now();
      apply(reduceTabBarScroll(stateRef.current, { type: "scroll", now }, TAB_BAR_IDLE_MS));
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      const due = stateRef.current.idleDueAt;
      if (due === null) {
        return;
      }
      timer = setTimeout(() => {
        apply(
          reduceTabBarScroll(stateRef.current, { type: "tick", now: Date.now() }, TAB_BAR_IDLE_MS),
        );
      }, Math.max(0, due - Date.now()));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, []);

  return hidden;
}

export default function WebTabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const insets = useSafeAreaInsets();
  const hidden = useTabBarHidden();
  const documentScroll = isDocumentScrollPath(pathname);
  const reserve = webTabBarReserve(insets.bottom, theme.spacing.md);
  const host = document.getElementById("document-scroll");

  const tree = (
    <WebTabBarInsetContext.Provider value={documentScroll ? reserve : null}>
      <View
        style={[
          styles.page,
          {
            backgroundColor: colors.background,
            paddingBottom: documentScroll ? reserve : 0,
            ...(documentScroll ? ({ minHeight: "100dvh" } as unknown as ViewStyle) : null),
          },
        ]}
      >
        <Slot />
      </View>
      <View
        pointerEvents={hidden ? "none" : "auto"}
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, theme.spacing.md),
            transform: [{ translateY: hidden ? reserve : 0 }],
            opacity: hidden ? 0 : 1,
          },
        ]}
      >
        {TABS.map((tab) => {
          const selected = pathname === tab.href;
          const tint = selected ? colors.accent : colors.textSecondary;
          return (
            <Pressable
              key={tab.href}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                router.navigate(tab.href);
              }}
              style={[
                styles.item,
                selected
                  ? {
                      backgroundColor: scheme === "dark" ? colors.accentSoft : "#E8F2FF",
                    }
                  : null,
              ]}
            >
              <AppIcon name={selected ? tab.filled : tab.outline} color={tint} size={24} />
              <AppText
                style={{
                  color: tint,
                  fontFamily: "Inter_500Medium",
                  fontSize: 11,
                  lineHeight: 14,
                  marginTop: 2,
                }}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </WebTabBarInsetContext.Provider>
  );

  if (!documentScroll || host === null) {
    return tree;
  }

  return createPortal(tree, host);
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
  },
  bar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    flexDirection: "row",
    borderTopWidth: 1,
    transitionDuration: `${TAB_BAR_ANIMATION_MS}ms`,
    transitionProperty: "transform, opacity",
  } as ViewStyle,
  item: {
    flex: 1,
    height: 48,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
});
