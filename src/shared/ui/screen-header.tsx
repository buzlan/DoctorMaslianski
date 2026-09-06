import { AppText } from "./app-text";
import { Stack } from "./stack";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <Stack gap="xs">
      <AppText variant="display">{title}</AppText>
      {subtitle !== undefined ? (
        <AppText tone="secondary">{subtitle}</AppText>
      ) : null}
    </Stack>
  );
}
