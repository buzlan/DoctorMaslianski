import { AppText } from "./app-text";
import { Button } from "./button";
import { Stack } from "./stack";

type ScreenStateProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenState({
  message,
  actionLabel,
  onAction,
}: ScreenStateProps) {
  return (
    <Stack gap="md">
      <AppText tone="secondary">{message}</AppText>
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button variant="tertiary" label={actionLabel} onPress={onAction} />
      ) : null}
    </Stack>
  );
}
