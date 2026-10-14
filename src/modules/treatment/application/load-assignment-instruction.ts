import type { DetailedInstruction } from "../domain";
import {
  sharedTreatmentRepository,
  type TreatmentRepository,
} from "../infrastructure";
import { resolveInstructionPhotoUrl } from "../infrastructure/instruction-photo-gateway";

export type AssignmentInstructionLoadResult =
  | { status: "not_found" }
  | { status: "error" }
  | {
      status: "ready";
      title: string;
      instruction: DetailedInstruction;
      photos: readonly { id: string; displayUri: string }[];
      photosUnavailable: boolean;
    };

export async function loadAssignmentInstruction(
  repository: TreatmentRepository,
  assignmentId: string,
  resolvePhoto: (
    path: string,
  ) => Promise<string | null> = resolveInstructionPhotoUrl,
): Promise<AssignmentInstructionLoadResult> {
  try {
    const treatment = await repository.getActiveTreatment();
    const assignment = treatment?.assignments.find(
      (item) => item.id === assignmentId,
    );
    if (!assignment?.detailedInstruction) return { status: "not_found" };
    const instruction = assignment.detailedInstruction;
    const photos = await Promise.all(
      instruction.photoPaths.map(async (path) => {
        try {
          const displayUri = await resolvePhoto(path);
          return displayUri ? { id: path, displayUri } : null;
        } catch {
          return null;
        }
      }),
    );
    return {
      status: "ready",
      title: assignment.title ?? "",
      instruction,
      photos: photos.filter(
        (photo): photo is NonNullable<typeof photo> => photo !== null,
      ),
      photosUnavailable: photos.some((photo) => photo === null),
    };
  } catch {
    return { status: "error" };
  }
}

export function loadSharedAssignmentInstruction(assignmentId: string) {
  return loadAssignmentInstruction(sharedTreatmentRepository, assignmentId);
}
