import type { AppIconName } from "@/shared/ui";

/** Neutral presentational icons for assignment tiles until backend sends iconKey. */
export const ASSIGNMENT_ICON_POOL = [
  "clipboard-outline",
  "calendar-outline",
  "book-outline",
  "shield-checkmark-outline",
  "home-outline",
] as const satisfies readonly AppIconName[];

export const ASSIGNMENT_ICON_FALLBACK: AppIconName = "clipboard-outline";

function hashAssignmentId(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function isKnownAssignmentIcon(value: string): value is AppIconName {
  return (ASSIGNMENT_ICON_POOL as readonly string[]).includes(value);
}

/**
 * Resolves the tile icon for a Today assignment.
 * Prefer backend `iconKey` when present; otherwise pick a stable mock from the pool by id.
 * Does not infer medical meaning from titles.
 */
export function resolveAssignmentIcon(input: {
  assignmentId: string;
  iconKey?: string;
}): AppIconName {
  if (input.iconKey !== undefined && input.iconKey.length > 0) {
    if (isKnownAssignmentIcon(input.iconKey)) {
      return input.iconKey;
    }
    return ASSIGNMENT_ICON_FALLBACK;
  }

  const index = hashAssignmentId(input.assignmentId) % ASSIGNMENT_ICON_POOL.length;
  return ASSIGNMENT_ICON_POOL[index] ?? ASSIGNMENT_ICON_FALLBACK;
}
