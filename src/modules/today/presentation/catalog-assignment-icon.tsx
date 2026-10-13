import { useEffect, useState } from "react";
import { AppState, Image, StyleSheet, useColorScheme, View } from "react-native";

import { ASSIGNMENT_ICON_URL_TTL_SECONDS, resolveAssignmentIconUrl } from "@/modules/treatment/infrastructure/assignment-icon-gateway";
import { getColors, theme } from "@/shared/theme";

const URL_TTL_MS = ASSIGNMENT_ICON_URL_TTL_SECONDS * 1000;
const REFRESH_EARLY_MS = 20_000;

const rememberedIcons = new Map<string, { url: string; expiresAt: number }>();

function rememberedIcon(path: string | undefined): { path: string; url: string } | null {
  if (!path) {
    return null;
  }
  const hit = rememberedIcons.get(path);
  if (!hit || hit.expiresAt - REFRESH_EARLY_MS <= Date.now()) {
    return null;
  }
  return { path, url: hit.url };
}

function rememberIcon(path: string, url: string) {
  rememberedIcons.set(path, { url, expiresAt: Date.now() + URL_TTL_MS });
}

export function CatalogAssignmentIcon({
  path,
}: {
  path?: string;
}) {
  const colors = getColors(useColorScheme());
  const [image, setImage] = useState<{ path: string; url: string } | null>(() =>
    rememberedIcon(path),
  );

  useEffect(() => {
    if (!path) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function resolve() {
      const url = await resolveAssignmentIconUrl(path!);
      if (cancelled) {
        return;
      }
      if (url) {
        rememberIcon(path!, url);
        setImage({ path: path!, url });
      } else {
        rememberedIcons.delete(path!);
        setImage(null);
      }
    }

    function schedule(delay: number) {
      timer = setTimeout(() => {
        void resolve().finally(() => {
          if (!cancelled) {
            schedule(URL_TTL_MS - REFRESH_EARLY_MS);
          }
        });
      }, delay);
    }

    const cached = rememberedIcon(path);
    if (cached) {
      setImage(cached);
      const hit = rememberedIcons.get(path);
      const delay = hit ? Math.max(0, hit.expiresAt - Date.now() - REFRESH_EARLY_MS) : 0;
      schedule(delay);
    } else {
      void resolve().finally(() => {
        if (!cancelled) {
          schedule(URL_TTL_MS - REFRESH_EARLY_MS);
        }
      });
    }

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && rememberedIcon(path) === null) {
        void resolve();
      }
    });

    return () => {
      cancelled = true;
      if (timer !== null) {
        clearTimeout(timer);
      }
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
        source={{ uri: source.url }}
        style={styles.image}
        resizeMode="contain"
        fadeDuration={0}
        accessible={false}
        onError={() => {
          rememberedIcons.delete(source.path);
          setImage((current) => (current?.url === source.url ? null : current));
          void resolveAssignmentIconUrl(source.path).then((url) => {
            if (!url) {
              return;
            }
            rememberIcon(source.path, url);
            setImage({ path: source.path, url });
          });
        }}
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
