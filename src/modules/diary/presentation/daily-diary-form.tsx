import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  type ImageSourcePropType,
} from "react-native";

import type { VasScore, Wellbeing } from "@/modules/diary/domain";
import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText, Button, Card, Stack } from "@/shared/ui";

import { diaryAssets } from "./diary-assets";
import {
  DIARY_WELLBEING_VALUES,
  toDiarySubmitAnswers,
  toVasScore,
} from "./diary-scale";
import { DiaryScaleGuide } from "./diary-scale-guide";
import { DiaryScaleSlider } from "./diary-scale-slider";

const WELLBEING_EMOJI: Record<Wellbeing, string> = {
  better: "🙂",
  unchanged: "😐",
  worse: "☹️",
};

const WELLBEING_LABEL: Record<Wellbeing, string> = {
  better: copy.diary.wellbeingBetter,
  unchanged: copy.diary.wellbeingUnchanged,
  worse: copy.diary.wellbeingWorse,
};

const WELLBEING_SELECTED = {
  better: {
    background: "#E5F6EC",
    border: "#35A56A",
    text: "#1E8E52",
  },
  worse: {
    background: "#FDECEC",
    border: "#E36A72",
    text: "#D64550",
  },
} as const;

type DailyDiaryFormProps = {
  submitting: boolean;
  onSubmit: (answers: {
    pain: VasScore;
    swelling: VasScore;
    wellbeing: Wellbeing;
  }) => void;
};

export function DailyDiaryForm({ submitting, onSubmit }: DailyDiaryFormProps) {
  const [pain, setPain] = useState<VasScore | null>(null);
  const [swelling, setSwelling] = useState<VasScore | null>(null);
  const [wellbeing, setWellbeing] = useState<Wellbeing | null>(null);
  const answers = toDiarySubmitAnswers(pain, swelling, wellbeing);

  return (
    <Stack gap="md">
      <DiaryScaleGuide />
      <ScaleCard
        title={copy.diary.painLabel}
        question={copy.diary.painQuestion}
        icon={diaryAssets.painBody}
        iconSize={56}
        value={pain}
        disabled={submitting}
        onChange={(next) => setPain(toVasScore(next))}
        anchors={[
          copy.diary.painNone,
          copy.diary.painModerate,
          copy.diary.painStrong,
        ]}
      />
      <ScaleCard
        title={copy.diary.swellingLabel}
        question={copy.diary.swellingQuestion}
        icon={diaryAssets.swellingLeg}
        iconSize={48}
        value={swelling}
        disabled={submitting}
        onChange={(next) => setSwelling(toVasScore(next))}
        anchors={[
          copy.diary.swellingNone,
          copy.diary.swellingModerate,
          copy.diary.swellingStrong,
        ]}
      />
      <Card variant="elevated">
        <Stack gap="sm">
          <AppText variant="title" style={styles.cardTitle}>
            {copy.diary.wellbeingQuestion}
          </AppText>
          <View style={styles.wellbeingRow}>
            {DIARY_WELLBEING_VALUES.map((value) => (
              <WellbeingPill
                key={value}
                value={value}
                selected={wellbeing === value}
                disabled={submitting}
                onPress={() => setWellbeing(value)}
              />
            ))}
          </View>
        </Stack>
      </Card>
      <Button
        variant="primary"
        label={copy.diary.submit}
        disabled={answers === null || submitting}
        onPress={() => {
          if (answers === null) {
            return;
          }
          onSubmit(answers);
        }}
      />
    </Stack>
  );
}

function ScaleCard({
  title,
  question,
  icon,
  iconSize,
  value,
  disabled,
  onChange,
  anchors,
}: {
  title: string;
  question: string;
  icon: ImageSourcePropType;
  iconSize: number;
  value: VasScore | null;
  disabled: boolean;
  onChange: (value: number) => void;
  anchors: readonly [string, string, string];
}) {
  return (
    <Card variant="elevated">
      <View style={styles.scaleBody}>
        <View style={styles.scaleHeader}>
          <View style={styles.scaleCopy}>
            <AppText variant="title" style={styles.cardTitle}>
              {title}
            </AppText>
            <AppText variant="caption" tone="secondary">
              {question}
            </AppText>
          </View>
          <Image
            source={icon}
            resizeMode="contain"
            accessible={false}
            importantForAccessibility="no"
            style={{ width: iconSize, height: iconSize }}
          />
        </View>
        <DiaryScaleSlider
          value={value}
          onChange={onChange}
          disabled={disabled}
          accessibilityLabel={question}
        />
        <View style={styles.anchors}>
          <AppText variant="caption" tone="secondary" style={styles.anchorText}>
            {anchors[0]}
          </AppText>
          <AppText
            variant="caption"
            tone="secondary"
            style={[styles.anchorText, styles.anchorCenter]}
          >
            {anchors[1]}
          </AppText>
          <AppText
            variant="caption"
            tone="secondary"
            style={[styles.anchorText, styles.anchorEnd]}
          >
            {anchors[2]}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

function WellbeingPill({
  value,
  selected,
  disabled,
  onPress,
}: {
  value: Wellbeing;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = getColors(useColorScheme());
  const tone =
    value === "unchanged"
      ? {
          background: colors.accentSoft,
          border: colors.borderStrong,
          text: colors.textSecondary,
        }
      : WELLBEING_SELECTED[value];
  const label = WELLBEING_LABEL[value];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: selected ? tone.background : colors.surface,
          borderColor: selected ? tone.border : colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <AppText style={styles.emoji}>{WELLBEING_EMOJI[value]}</AppText>
      <AppText
        variant="label"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={{
          color: selected ? tone.text : colors.textPrimary,
          fontSize: 12,
          lineHeight: 16,
          flexShrink: 1,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  scaleBody: {
    gap: theme.spacing.sm,
  },
  scaleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  scaleCopy: {
    flex: 1,
    gap: 2,
  },
  anchors: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  anchorText: {
    fontSize: 12,
    lineHeight: 16,
  },
  anchorCenter: {
    flex: 1,
    textAlign: "center",
  },
  anchorEnd: {
    textAlign: "right",
  },
  wellbeingRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.spacing.sm,
  },
  pill: {
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 40,
    paddingHorizontal: 6,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emoji: {
    fontSize: 15,
    lineHeight: 22,
  },
});
