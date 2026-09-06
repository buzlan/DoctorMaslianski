import { useLocalSearchParams } from "expo-router";

import { MilestoneDetailScreen } from "@/modules/treatment";

export default function MilestoneDetailRoute() {
  const { milestoneId } = useLocalSearchParams<{
    milestoneId?: string | string[];
  }>();

  return <MilestoneDetailScreen milestoneId={milestoneId} />;
}
