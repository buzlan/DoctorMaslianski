import { DiaryScreen } from "@/modules/diary";
import { TabSwipeRoot } from "@/shared/navigation";

export default function DiaryTab() {
  return (
    <TabSwipeRoot tab="/diary">
      <DiaryScreen />
    </TabSwipeRoot>
  );
}
