import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { AppState, StyleSheet, useColorScheme, View } from "react-native";

import { resolveAssignmentIconUrl } from "@/modules/treatment/infrastructure/assignment-icon-gateway";
import { getColors, theme } from "@/shared/theme";

export function CatalogAssignmentIcon({
  path,
}: {
  path?: string;
}) {
  const colors = getColors(useColorScheme());
  const [image, setImage] = useState<{ path: string; url: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    let generation = 0;
    async function resolve() {
      if (!path) return;
      const current = ++generation;
      const url = await resolveAssignmentIconUrl(path);
      if (!cancelled && current === generation)
        setImage(url ? { path, url } : null);
    }
    void resolve();
    const timer = setInterval(() => void resolve(), 240000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void resolve();
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      subscription.remove();
    };
  }, [path]);

  if (!path || image?.path !== path) {
    return <View style={[styles.well, { backgroundColor: colors.accentSoft }]} />;
  }

  const source = image;
  return (
    <View style={[styles.well, { backgroundColor: colors.accentSoft }]}>
      <Image
        source={{ uri: source.url, cacheKey: source.path }}
        style={styles.image}
        contentFit="contain"
        cachePolicy="memory"
        recyclingKey={source.path}
        accessible={false}
        onError={() =>
          setImage((current) => (current?.url === source.url ? null : current))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: 36, height: 36 },
});
