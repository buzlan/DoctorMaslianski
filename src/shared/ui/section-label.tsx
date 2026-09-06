import { AppText } from "./app-text";

type SectionLabelProps = {
  children: string;
};

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <AppText variant="label" tone="secondary">
      {children}
    </AppText>
  );
}
