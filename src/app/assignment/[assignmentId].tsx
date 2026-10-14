import { useLocalSearchParams } from "expo-router";
import { AssignmentInstructionScreen } from "@/modules/treatment";

export default function AssignmentInstructionRoute() {
  const { assignmentId } = useLocalSearchParams<{
    assignmentId?: string | string[];
  }>();
  return (
    <AssignmentInstructionScreen
      assignmentId={
        typeof assignmentId === "string"
          ? assignmentId
          : (assignmentId?.[0] ?? "")
      }
    />
  );
}
