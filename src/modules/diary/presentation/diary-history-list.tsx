import type { DiaryHistoryItem } from "@/modules/diary/application";
import type { Wellbeing } from "@/modules/diary/domain";
import { copy } from "@/shared/copy";
import { formatCalendarDate } from "@/shared/date/format-calendar-date";
import { AppText, Card, Stack } from "@/shared/ui";

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
      <AppText variant="title">{copy.diary.entriesLabel}</AppText>
      {items.map((item) => (
        <Card key={item.id} variant="elevated">
          <Stack gap="xs">
            <AppText variant="title">{formatCalendarDate(item.submittedOn)}</AppText>
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
        </Card>
      ))}
    </Stack>
  );
}
