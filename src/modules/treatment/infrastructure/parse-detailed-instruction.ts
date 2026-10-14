import type { Json } from "@/core/supabase/database.types";
import type { DetailedInstruction } from "../domain";

export function parseDetailedInstruction(
  value: Json | undefined,
): DetailedInstruction | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  if (
    typeof value.heading !== "string" ||
    typeof value.text !== "string" ||
    !Array.isArray(value.photo_paths) ||
    !value.photo_paths.every(
      (path): path is string => typeof path === "string" && path.length > 0,
    )
  )
    return undefined;
  if (
    !value.heading.trim() &&
    !value.text.trim() &&
    value.photo_paths.length === 0
  )
    return undefined;
  return {
    heading: value.heading,
    text: value.text,
    photoPaths: [...value.photo_paths],
  };
}
