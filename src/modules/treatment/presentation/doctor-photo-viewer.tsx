import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderCallbacks,
  type PanResponderGestureState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MilestoneDoctorPhotoItem } from "@/modules/treatment/application";
import { copy } from "@/shared/copy";

type PhotoSize = { width: number; height: number };
type PhotoTransform = { scale: number; x: number; y: number };

const INITIAL_PHOTO_TRANSFORM: PhotoTransform = { scale: 1, x: 0, y: 0 };

function fitPhoto(image: PhotoSize, viewport: PhotoSize): PhotoSize {
  if (!image.width || !image.height || !viewport.width || !viewport.height) {
    return viewport;
  }

  const ratio = Math.min(
    viewport.width / image.width,
    viewport.height / image.height,
  );
  return { width: image.width * ratio, height: image.height * ratio };
}

function constrainPhoto(
  transform: PhotoTransform,
  photo: PhotoSize,
  viewport: PhotoSize,
): PhotoTransform {
  const scale = Math.max(1, Math.min(5, transform.scale));
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
  onClose: () => void;
};

export function DoctorPhotoViewer({
  items,
  initialIndex,
  onClose,
}: DoctorPhotoViewerProps) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const safeIndex = Math.max(0, Math.min(index, items.length - 1));
  const photo = items[safeIndex];

  const changePhoto = useCallback(
    (offset: number) => {
      setIndex((current) =>
        Math.max(0, Math.min(current + offset, items.length - 1)),
      );
    },
    [items.length],
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          changePhoto(-1);
          break;
        case "ArrowRight":
          changePhoto(1);
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changePhoto, onClose]);

  if (!photo) return null;

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
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.toolbar}>
          <Text style={styles.label}>
            {copy.treatment.doctorPhotoCount} · {safeIndex + 1}{" "}
            {copy.treatment.photoCounterOf} {items.length}
          </Text>
          <ViewerButton
            label={copy.treatment.photoClose}
            text="×"
            onPress={onClose}
          />
        </View>

        <PhotoCanvas
          key={`${photo.id}:${photo.displayUri}`}
          photo={photo}
          photoNumber={safeIndex + 1}
          onSwipe={changePhoto}
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

function PhotoCanvas({
  photo,
  photoNumber,
  onSwipe,
}: {
  photo: MilestoneDoctorPhotoItem;
  photoNumber: number;
  onSwipe: (offset: number) => void;
}) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const { photoSize, transform, onLayout, zoomBy, panHandlers } =
    usePhotoViewerGestures(imageSize, onSwipe);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (status !== "ready") return;
      if (!["+", "=", "-"].includes(event.key)) return;
      event.preventDefault();
      zoomBy(event.key === "-" ? -0.5 : 0.5);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, zoomBy]);

  return (
    <>
      <View style={styles.viewport} onLayout={onLayout} {...panHandlers}>
        <Image
          key={attempt}
          source={{ uri: photo.displayUri }}
          contentFit="contain"
          accessibilityLabel={`${copy.treatment.doctorPhotoAccessibilityLabel} ${photoNumber}`}
          style={{
            ...photoSize,
            transform: [
              { translateX: transform.x },
              { translateY: transform.y },
              { scale: transform.scale },
            ],
          }}
          onLoad={(event) => {
            setImageSize({
              width: event.source.width,
              height: event.source.height,
            });
            setStatus("ready");
          }}
          onError={() => setStatus("error")}
        />
        {status === "loading" ? (
          <ActivityIndicator style={StyleSheet.absoluteFill} color="#fff" />
        ) : null}
      </View>

      {status === "error" ? (
        <View style={styles.error}>
          <Text style={styles.label}>{copy.treatment.photoLoadError}</Text>
          <ViewerButton
            label={copy.treatment.photoRetryLoading}
            text="↻"
            onPress={() => {
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}
          />
        </View>
      ) : null}
    </>
  );
}

function pinchDistance(event: GestureResponderEvent) {
  const [first, second] = event.nativeEvent.touches;
  return first && second
    ? Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY)
    : 0;
}

function usePhotoViewerGestures(
  imageSize: PhotoSize,
  onSwipe: (offset: number) => void,
) {
  const [viewport, setViewport] = useState<PhotoSize>({ width: 0, height: 0 });
  const [transform, setTransform] = useState(INITIAL_PHOTO_TRANSFORM);
  const current = useRef(transform);
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

  const apply = useCallback(
    (next: PhotoTransform) => {
      const value = constrainPhoto(next, photoSize, viewport);
      current.current = value;
      setTransform(value);
    },
    [photoSize, viewport],
  );

  const zoomBy = useCallback(
    (amount: number) => {
      apply({ ...current.current, scale: current.current.scale + amount });
    },
    [apply],
  );

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
    current.current = INITIAL_PHOTO_TRANSFORM;
    setTransform(INITIAL_PHOTO_TRANSFORM);
  }

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
      if (event.nativeEvent.touches.length > 1) {
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
      if (
        !hadMultipleTouches.current &&
        start.current.scale === 1 &&
        current.current.scale === 1 &&
        Math.abs(gesture.dx) > 50 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5
      ) {
        onSwipe(gesture.dx < 0 ? 1 : -1);
      }
    },
    [onSwipe],
  );

  const responder = useMemo(() => createPhotoResponder(), []);

  useEffect(() => {
    responder.updateHandlers({
      onPanResponderGrant: onGrant,
      onPanResponderMove: onMove,
      onPanResponderRelease: onRelease,
    });
    return () => responder.updateHandlers({});
  }, [responder, onGrant, onMove, onRelease]);

  return {
    photoSize,
    transform,
    onLayout,
    zoomBy,
    panHandlers: responder.panHandlers,
  };
}

function createPhotoResponder() {
  let handlers: PanResponderCallbacks = {};
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event, gesture) =>
      handlers.onPanResponderGrant?.(event, gesture),
    onPanResponderMove: (event, gesture) =>
      handlers.onPanResponderMove?.(event, gesture),
    onPanResponderRelease: (event, gesture) =>
      handlers.onPanResponderRelease?.(event, gesture),
  });

  return {
    panHandlers: responder.panHandlers,
    updateHandlers(next: PanResponderCallbacks) {
      handlers = next;
    },
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090b10" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  label: { color: "#fff", fontSize: 16 },
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
    backgroundColor: "#252832",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 22 },
  error: { alignItems: "center", gap: 8 },
});
