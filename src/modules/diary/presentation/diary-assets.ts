/**
 * Static diary illustrations. Paths are fixed so Metro can resolve them
 * without a dynamic require.
 */
export const diaryAssets = {
  painGuide: require("../../../../assets/images/diary/pain-scale-guide.png"),
  painBody: require("../../../../assets/images/diary/pain-body.png"),
  swellingLeg: require("../../../../assets/images/diary/swelling-leg.png"),
} as const;
