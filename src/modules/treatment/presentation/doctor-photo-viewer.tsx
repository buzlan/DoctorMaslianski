import { Image } from "expo-image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MilestoneDoctorPhotoItem } from "@/modules/treatment/application";
import { copy } from "@/shared/copy";
import { getColors } from "@/shared/theme";

type PhotoSize = {
  width: number;
  height: number;
};

type PhotoTransform = {
  scale: number;
  x: number;
  y: number;
};

const PHOTO_SLIDE_DURATION_MS = 300;
const SWIPE_THRESHOLD = 50;
const MAX_PHOTO_SCALE = 5;

const INITIAL_PHOTO_TRANSFORM: PhotoTransform = {
  scale: 1,
  x: 0,
  y: 0,
};

function fitPhoto(image: PhotoSize, viewport: PhotoSize): PhotoSize {
  if (!image.width || !image.height || !viewport.width || !viewport.height) {
    return viewport;
  }

  const ratio = Math.min(
    viewport.width / image.width,
    viewport.height / image.height,
  );

  return {
    width: image.width * ratio,
    height: image.height * ratio,
  };
}

function constrainPhoto(
  transform: PhotoTransform,
  photo: PhotoSize,
  viewport: PhotoSize,
): PhotoTransform {
  const scale = Math.max(1, Math.min(MAX_PHOTO_SCALE, transform.scale));

  const maxX = Math.max(0, (photo.width * scale - viewport.width) / 2);
  const maxY = Math.max(0, (photo.height * scale - viewport.height) / 2);

  return {
    scale,
    x: Math.max(-maxX, Math.min(maxX, transform.x)),
    y: Math.max(-maxY, Math.min(maxY, transform.y)),
  };
}

type DoctorPhotoViewerProps = {
  items: readonly MilestoneDoctorPhotoItem[];
  initialIndex: number;
  photoLabel?: string;
  onClose: () => void;
};

type NavigationState = {
  index: number;
  outgoing: MilestoneDoctorPhotoItem | null;
  direction: number;
};

export function DoctorPhotoViewer({
  items,
  initialIndex,
  photoLabel,
  onClose,
}: DoctorPhotoViewerProps) {
  const insets = useSafeAreaInsets();
  const colors = getColors(useColorScheme());

  const [navigation, setNavigation] = useState<NavigationState>(() => ({
    index: Math.max(0, Math.min(initialIndex, items.length - 1)),
    outgoing: null,
    direction: 1,
  }));

  const safeIndex = Math.max(0, Math.min(navigation.index, items.length - 1));

  const photo = items[safeIndex];

  const changingPhoto = useRef(false);

  const finishPhotoChange = useCallback(() => {
    changingPhoto.current = false;

    setNavigation((current) => {
      if (!current.outgoing) {
        return current;
      }

      return {
        ...current,
        outgoing: null,
      };
    });
  }, []);

  useEffect(() => {
    const uris = [
      items[safeIndex]?.displayUri,
      items[safeIndex - 1]?.displayUri,
      items[safeIndex + 1]?.displayUri,
    ].filter((uri): uri is string => Boolean(uri));

    if (uris.length === 0) {
      return;
    }

    void Image.prefetch(uris, {
      cachePolicy: "memory-disk",
    }).catch(() => {});
  }, [items, safeIndex]);

  const changePhoto = useCallback(
    (offset: number) => {
      if (changingPhoto.current) {
        return;
      }

      const next = Math.max(0, Math.min(safeIndex + offset, items.length - 1));

      if (next === safeIndex) {
        return;
      }

      const outgoing = items[safeIndex];

      if (!outgoing) {
        return;
      }

      changingPhoto.current = true;

      setNavigation({
        index: next,
        outgoing,
        direction: next > safeIndex ? 1 : -1,
      });
    },
    [items, safeIndex],
  );

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          break;

        case "ArrowLeft":
          event.preventDefault();
          changePhoto(-1);
          break;

        case "ArrowRight":
          event.preventDefault();
          changePhoto(1);
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [changePhoto, onClose]);

  if (!photo) {
    return null;
  }

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        accessibilityViewIsModal
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.toolbar}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {photoLabel ?? copy.treatment.doctorPhotoCount} · {safeIndex + 1}{" "}
            {copy.treatment.photoCounterOf} {items.length}
          </Text>

          <ViewerButton
            label={copy.treatment.photoClose}
            text="×"
            onPress={onClose}
          />
        </View>

        <PhotoCanvas
          photo={photo}
          photoLabel={photoLabel}
          photoNumber={safeIndex + 1}
          outgoing={navigation.outgoing}
          direction={navigation.direction}
          onSwipe={changePhoto}
          onTransitionEnd={finishPhotoChange}
        />

        {items.length > 1 ? (
          <View style={styles.controls}>
            <ViewerButton
              label={copy.treatment.previousPhoto}
              text="‹"
              onPress={() => changePhoto(-1)}
              disabled={safeIndex === 0}
            />

            <ViewerButton
              label={copy.treatment.nextPhoto}
              text="›"
              onPress={() => changePhoto(1)}
              disabled={safeIndex === items.length - 1}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

type PhotoCanvasProps = {
  photo: MilestoneDoctorPhotoItem;
  photoLabel?: string;
  photoNumber: number;
  outgoing: MilestoneDoctorPhotoItem | null;
  direction: number;
  onSwipe: (offset: number) => void;
  onTransitionEnd: () => void;
};

function PhotoCanvas({
  photo,
  photoLabel,
  photoNumber,
  outgoing,
  direction,
  onSwipe,
  onTransitionEnd,
}: PhotoCanvasProps) {
  const colors = getColors(useColorScheme());

  const [imageSize, setImageSize] = useState<PhotoSize>({
    width: 0,
    height: 0,
  });

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const [attempt, setAttempt] = useState(0);

  const [slide] = useState(() => new Animated.Value(0));

  const photoKey = `${photo.id}:${photo.displayUri}`;

  const transitionStarted = useRef(false);

  const {
    viewport,
    animatedScale,
    animatedX,
    animatedY,
    onLayout,
    zoomBy,
    panHandlers,
  } = usePhotoViewerGestures(imageSize, onSwipe, photoKey);

  const slideDistance = outgoing ? direction * viewport.width : 0;

  const outgoingTranslateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -slideDistance],
  });

  const incomingTranslateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [slideDistance, 0],
  });

  useLayoutEffect(() => {
    transitionStarted.current = false;

    slide.stopAnimation();
    slide.setValue(0);

    setImageSize({
      width: 0,
      height: 0,
    });

    setStatus("loading");
    setAttempt(0);

    return () => {
      slide.stopAnimation();
    };
  }, [photoKey, slide]);

  const startTransition = useCallback(() => {
    if (transitionStarted.current) {
      return;
    }

    transitionStarted.current = true;

    Animated.timing(slide, {
      toValue: 1,
      duration: outgoing ? PHOTO_SLIDE_DURATION_MS : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished) {
        onTransitionEnd();
      }
    });
  }, [onTransitionEnd, outgoing, slide]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (status !== "ready") {
        return;
      }

      if (!["+", "=", "-"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      zoomBy(event.key === "-" ? -0.5 : 0.5);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [status, zoomBy]);

  const handleImageLoad = useCallback(
    (event: { source: { width: number; height: number } }) => {
      setImageSize({
        width: event.source.width,
        height: event.source.height,
      });

      setStatus("ready");
      startTransition();
    },
    [startTransition],
  );

  const handleImageError = useCallback(() => {
    setStatus("error");

    startTransition();
  }, [startTransition]);

  const retryLoading = useCallback(() => {
    if (outgoing) {
      return;
    }

    transitionStarted.current = false;
    slide.stopAnimation();
    slide.setValue(0);

    setStatus("loading");
    setAttempt((value) => value + 1);
  }, [outgoing, slide]);

  return (
    <>
      <View style={styles.viewport} onLayout={onLayout} {...panHandlers}>
        {outgoing ? (
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  {
                    translateX: outgoingTranslateX,
                  },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: outgoing.displayUri }}
              cachePolicy="memory-disk"
              contentFit="contain"
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : null}

        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  translateX: incomingTranslateX,
                },
              ],
            },
          ]}
        >
          <Image
            key={`${photoKey}:${attempt}`}
            source={{ uri: photo.displayUri }}
            cachePolicy="memory-disk"
            contentFit="contain"
            accessibilityLabel={`${
              photoLabel ?? copy.treatment.doctorPhotoAccessibilityLabel
            } ${photoNumber}`}
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  { translateX: animatedX },
                  { translateY: animatedY },
                  { scale: animatedScale },
                ],
              },
            ]}
            onLoadStart={() => {
              setStatus("loading");
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </Animated.View>
      </View>

      {status === "error" ? (
        <View style={styles.error}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {copy.treatment.photoLoadError}
          </Text>

          <ViewerButton
            label={copy.treatment.photoRetryLoading}
            text="↻"
            onPress={retryLoading}
            disabled={Boolean(outgoing)}
          />
        </View>
      ) : null}
    </>
  );
}

function pinchDistance(event: GestureResponderEvent): number {
  const [first, second] = event.nativeEvent.touches;

  return first && second
    ? Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY)
    : 0;
}

type PhotoGestureHandlers = {
  onGrant: (
    event: GestureResponderEvent,
    gesture: PanResponderGestureState,
  ) => void;
  onMove: (
    event: GestureResponderEvent,
    gesture: PanResponderGestureState,
  ) => void;
  onRelease: (
    event: GestureResponderEvent,
    gesture: PanResponderGestureState,
  ) => void;
};

function usePhotoViewerGestures(
  imageSize: PhotoSize,
  onSwipe: (offset: number) => void,
  photoUri: string,
) {
  const [viewport, setViewport] = useState<PhotoSize>({
    width: 0,
    height: 0,
  });

  const animatedScale = useRef(
    new Animated.Value(INITIAL_PHOTO_TRANSFORM.scale),
  ).current;

  const animatedX = useRef(
    new Animated.Value(INITIAL_PHOTO_TRANSFORM.x),
  ).current;

  const animatedY = useRef(
    new Animated.Value(INITIAL_PHOTO_TRANSFORM.y),
  ).current;

  const current = useRef<PhotoTransform>(INITIAL_PHOTO_TRANSFORM);

  const hadMultipleTouches = useRef(false);

  const start = useRef({
    ...INITIAL_PHOTO_TRANSFORM,
    distance: 0,
    dx: 0,
    dy: 0,
  });

  const photoSize = useMemo(
    () => fitPhoto(imageSize, viewport),
    [imageSize, viewport],
  );

  const resetTransform = useCallback(() => {
    current.current = INITIAL_PHOTO_TRANSFORM;

    animatedScale.setValue(1);
    animatedX.setValue(0);
    animatedY.setValue(0);
  }, [animatedScale, animatedX, animatedY]);

  useLayoutEffect(() => {
    resetTransform();

    hadMultipleTouches.current = false;

    start.current = {
      ...INITIAL_PHOTO_TRANSFORM,
      distance: 0,
      dx: 0,
      dy: 0,
    };
  }, [photoUri, resetTransform]);

  const apply = useCallback(
    (next: PhotoTransform) => {
      const value = constrainPhoto(next, photoSize, viewport);

      current.current = value;

      animatedScale.setValue(value.scale);
      animatedX.setValue(value.x);
      animatedY.setValue(value.y);
    },
    [animatedScale, animatedX, animatedY, photoSize, viewport],
  );

  const zoomBy = useCallback(
    (amount: number) => {
      apply({
        ...current.current,
        scale: current.current.scale + amount,
      });
    },
    [apply],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;

      setViewport((currentViewport) => {
        if (
          currentViewport.width === width &&
          currentViewport.height === height
        ) {
          return currentViewport;
        }

        return { width, height };
      });

      resetTransform();
    },
    [resetTransform],
  );

  const onGrant = useCallback((event: GestureResponderEvent) => {
    hadMultipleTouches.current = event.nativeEvent.touches.length > 1;

    start.current = {
      ...current.current,
      distance: pinchDistance(event),
      dx: 0,
      dy: 0,
    };
  }, []);

  const onMove = useCallback(
    (event: GestureResponderEvent, gesture: PanResponderGestureState) => {
      const touches = event.nativeEvent.touches;

      if (touches.length > 1) {
        hadMultipleTouches.current = true;
      }

      const distance = pinchDistance(event);

      if (distance > 0) {
        if (!start.current.distance) {
          start.current = {
            ...current.current,
            distance,
            dx: gesture.dx,
            dy: gesture.dy,
          };
        }

        apply({
          ...current.current,
          scale: (start.current.scale * distance) / start.current.distance,
        });

        return;
      }

      if (start.current.distance > 0) {
        start.current = {
          ...current.current,
          distance: 0,
          dx: gesture.dx,
          dy: gesture.dy,
        };

        return;
      }

      apply({
        scale: current.current.scale,
        x: start.current.x + gesture.dx - start.current.dx,
        y: start.current.y + gesture.dy - start.current.dy,
      });
    },
    [apply],
  );

  const onRelease = useCallback(
    (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
      const isHorizontalSwipe =
        Math.abs(gesture.dx) > SWIPE_THRESHOLD &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;

      const canChangePhoto =
        !hadMultipleTouches.current &&
        start.current.scale === 1 &&
        current.current.scale === 1 &&
        isHorizontalSwipe;

      if (canChangePhoto) {
        onSwipe(gesture.dx < 0 ? 1 : -1);
      }
    },
    [onSwipe],
  );

  const handlers = useRef<PhotoGestureHandlers>({
    onGrant,
    onMove,
    onRelease,
  });

  handlers.current = {
    onGrant,
    onMove,
    onRelease,
  };

  const responder = useMemo(() => {
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (event, gesture) => {
        handlers.current.onGrant(event, gesture);
      },

      onPanResponderMove: (event, gesture) => {
        handlers.current.onMove(event, gesture);
      },

      onPanResponderRelease: (event, gesture) => {
        handlers.current.onRelease(event, gesture);
      },
    });

    return panResponder;
  }, []);

  return {
    viewport,
    animatedScale,
    animatedX,
    animatedY,
    onLayout,
    zoomBy,
    panHandlers: responder.panHandlers,
  };
}

function ViewerButton({
  label,
  text,
  onPress,
  disabled = false,
}: {
  label: string;
  text: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = getColors(useColorScheme());

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: disabled ? 0.3 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: colors.accent }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  label: {
    fontSize: 16,
  },

  viewport: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    padding: 12,
  },

  button: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontSize: 22,
  },

  error: {
    alignItems: "center",
    gap: 8,
  },
});
