import { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Card } from "@/shared/ui";

import { diaryAssets } from "./diary-assets";

const FACE_SIZE = 28;
const GUIDE_MODAL_HEADER_BODY = 60;

type Mouth = "smile" | "soft" | "flat" | "frown" | "sad";

export const DIARY_SCALE_GUIDE_STEPS = [
  {
    range: "0",
    label: copy.diary.painGuideNone,
    color: "#2EAE4E",
    mouth: "smile",
  },
  {
    range: "1–3",
    label: copy.diary.painGuideMild,
    color: "#7BC96A",
    mouth: "soft",
  },
  {
    range: "4–6",
    label: copy.diary.painGuideModerate,
    color: "#E6B325",
    mouth: "flat",
  },
  {
    range: "7–9",
    label: copy.diary.painGuideSevere,
    color: "#F08A24",
    mouth: "frown",
  },
  {
    range: "10",
    label: copy.diary.painGuideExtreme,
    color: "#E34848",
    mouth: "sad",
  },
] as const satisfies readonly {
  range: string;
  label: string;
  color: string;
  mouth: Mouth;
}[];

export function DiaryScaleGuide() {
  const colors = getColors(useColorScheme());
  const [open, setOpen] = useState(false);
  const closeGuide = () => setOpen(false);

  return (
    <>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <AppText variant="label" style={styles.title}>
            {copy.diary.painGuideTitle}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.diary.painGuideOpen}
            hitSlop={8}
            onPress={() => setOpen(true)}
            style={[styles.infoButton, { borderColor: colors.accent }]}
          >
            <AppText style={[styles.infoMark, { color: colors.accent }]}>i</AppText>
          </Pressable>
        </View>
        <View style={styles.columns}>
          {DIARY_SCALE_GUIDE_STEPS.map((step) => (
            <View
              key={step.range}
              accessible
              accessibilityLabel={`${step.range}, ${step.label}`}
              style={styles.column}
            >
              <ScaleFace color={step.color} mouth={step.mouth} />
              <AppText style={[styles.range, { color: colors.textSecondary }]}>
                {step.range}
              </AppText>
              <AppText
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={[styles.caption, { color: colors.textSecondary }]}
              >
                {step.label}
              </AppText>
            </View>
          ))}
        </View>
      </Card>
      <DiaryScaleGuideModal visible={open} onClose={closeGuide} />
    </>
  );
}

function DiaryScaleGuideModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = getColors(useColorScheme());
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0,
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.modalHeader,
            {
              height: GUIDE_MODAL_HEADER_BODY + topInset,
              paddingTop: topInset,
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.diary.painGuideClose}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeTarget,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View
              style={[styles.closeDisc, { backgroundColor: colors.accentSoft }]}
            >
              <CloseMark color={colors.accent} />
            </View>
          </Pressable>
        </View>
        <View
          style={[
            styles.modalImageWrap,
            { paddingBottom: Math.max(insets.bottom, theme.spacing.md) },
          ]}
        >
          <Image
            source={diaryAssets.painGuide}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={copy.diary.painGuideTitle}
            style={styles.modalImage}
          />
        </View>
      </View>
    </Modal>
  );
}

function CloseMark({ color }: { color: string }) {
  return (
    <View style={styles.closeMark}>
      <View
        style={[
          styles.closeBar,
          { backgroundColor: color, transform: [{ rotate: "45deg" }] },
        ]}
      />
      <View
        style={[
          styles.closeBar,
          { backgroundColor: color, transform: [{ rotate: "-45deg" }] },
        ]}
      />
    </View>
  );
}

function ScaleFace({ color, mouth }: { color: string; mouth: Mouth }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.face, { borderColor: color }]}
    >
      <View style={styles.eyes}>
        <View style={[styles.eye, { backgroundColor: color }]} />
        <View style={[styles.eye, { backgroundColor: color }]} />
      </View>
      <ScaleMouth color={color} mouth={mouth} />
    </View>
  );
}

function ScaleMouth({ color, mouth }: { color: string; mouth: Mouth }) {
  if (mouth === "flat") {
    return <View style={[styles.flatMouth, { backgroundColor: color }]} />;
  }

  const deep = mouth === "smile" || mouth === "sad";
  const frown = mouth === "frown" || mouth === "sad";

  return (
    <View
      style={[
        styles.curveMouth,
        deep ? styles.curveMouthDeep : styles.curveMouthSoft,
        frown ? styles.curveMouthFrown : undefined,
        {
          borderBottomColor: color,
          borderLeftColor: color,
          borderRightColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: 22,
  },
  title: {
    flex: 1,
  },
  infoButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  infoMark: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    includeFontPadding: false,
  },
  columns: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  face: {
    width: FACE_SIZE,
    height: FACE_SIZE,
    borderRadius: FACE_SIZE / 2,
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  eyes: {
    flexDirection: "row",
    gap: 6,
  },
  eye: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  flatMouth: {
    width: 10,
    height: 1.6,
    borderRadius: 1,
    marginTop: 1,
  },
  curveMouth: {
    borderBottomWidth: 1.6,
    borderLeftWidth: 1.6,
    borderRightWidth: 1.6,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 1,
  },
  curveMouthDeep: {
    width: 13,
    height: 6,
  },
  curveMouthSoft: {
    width: 10,
    height: 5,
  },
  curveMouthFrown: {
    transform: [{ scaleY: -1 }],
  },
  range: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "center",
    includeFontPadding: false,
  },
  caption: {
    width: "100%",
    minHeight: 26,
    marginTop: 1,
    fontSize: 11,
    lineHeight: 13,
    textAlign: "center",
    includeFontPadding: false,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeTarget: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeMark: {
    width: 16,
    height: 16,
  },
  closeBar: {
    position: "absolute",
    width: 14,
    height: 2,
    borderRadius: 1,
    top: 7,
    left: 1,
  },
  modalImageWrap: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
});
