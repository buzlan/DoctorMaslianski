import { Image } from "expo-image";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import type { MilestoneDoctorPhotoItem } from "@/modules/treatment/application";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Stack } from "@/shared/ui";

type DoctorPhotoPagerProps = {
  items: readonly MilestoneDoctorPhotoItem[];
};

export function DoctorPhotoPager({ items }: DoctorPhotoPagerProps) {
  const colors = getColors(useColorScheme());
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width <= 0) {
      return;
    }

    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.min(Math.max(next, 0), items.length - 1));
  }

  return (
    <Stack gap="sm">
      <AppText variant="label" tone="secondary">
        {index + 1} {copy.treatment.photoCounterOf} {items.length}
      </AppText>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width);
        }}
        onMomentumScrollEnd={onScrollEnd}
      >
        {items.map((photo, photoIndex) => (
          <View
            key={photo.id}
            style={[
              styles.slide,
              { width: width > 0 ? width : undefined, flexGrow: 1 },
            ]}
          >
            <View
              style={[
                styles.frame,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Image
                source={{ uri: photo.displayUri }}
                style={styles.photo}
                contentFit="contain"
                accessibilityLabel={`${copy.treatment.doctorPhotoAccessibilityLabel} ${photoIndex + 1}`}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </Stack>
  );
}

const styles = StyleSheet.create({
  slide: {
    paddingRight: 0,
  },
  frame: {
    borderRadius: theme.radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    height: 320,
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
});
