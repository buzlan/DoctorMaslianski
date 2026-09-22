import { TreatmentScreen } from "@/modules/treatment";
import { TabSwipeRoot } from "@/shared/navigation";

export default function TreatmentTab() {
  return (
    <TabSwipeRoot tab="/treatment">
      <TreatmentScreen />
    </TabSwipeRoot>
  );
}
