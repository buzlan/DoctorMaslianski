import { TodayScreen } from "@/modules/today";
import { TabSwipeRoot } from "@/shared/navigation";

export default function TodayTab() {
  return (
    <TabSwipeRoot tab="/">
      <TodayScreen />
    </TabSwipeRoot>
  );
}
