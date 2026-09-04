import type { DiaryHistoryItem } from "@/modules/diary/application";
import type { Wellbeing } from "@/modules/diary/domain";
import { copy } from "@/shared/copy";
import { formatCalendarDate } from "@/shared/date/format-calendar-date";
import { AppText, Stack } from "@/shared/ui";

function wellbeingCopy(wellbeing: Wellbeing): string {
  switch (wellbeing) {
    case "better":
      return copy.diary.wellbeingBetter;
    case "unchanged":
      return copy.diary.wellbeingUnchanged;
    case "worse":
      return copy.diary.wellbeingWorse;
  }
}

export function DiaryHistoryList({
  items,
}: {
  items: readonly DiaryHistoryItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <AppText variant="caption" tone="secondary">
        {copy.diary.entriesLabel}
      </AppText>
      {items.map((item) => (
        <Stack key={item.id} gap="xs">
          <AppText>{formatCalendarDate(item.submittedOn)}</AppText>
          <AppText tone="secondary">
            {copy.diary.painLabel}: {item.pain} / 10
          </AppText>
          <AppText tone="secondary">
            {copy.diary.swellingLabel}: {item.swelling} / 10
          </AppText>
          <AppText tone="secondary">
            {copy.diary.wellbeingLabel}: {wellbeingCopy(item.wellbeing)}
          </AppText>
        </Stack>
      ))}
    </Stack>
  );
}
