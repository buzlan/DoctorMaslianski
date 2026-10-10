import {
  getSharedSupabaseClient,
  type AppSupabaseClient,
} from "@/core/supabase/client";

export const ASSIGNMENT_ICON_URL_TTL_SECONDS = 300;

export async function loadAssignmentIconPaths(
  client: AppSupabaseClient,
  treatmentId: string,
): Promise<Map<string, string | null>> {
  try {
    const { data, error } = await client.rpc("get_assignment_icons", {
      p_treatment_id: treatmentId,
    });
    if (error) return new Map();
    return new Map(
      (data ?? []).map((row) => [
        row.assignment_id,
        row.icon_storage_path || null,
      ]),
    );
  } catch {
    return new Map();
  }
}

export async function resolveAssignmentIconUrl(
  path: string,
  client: AppSupabaseClient | null = getSharedSupabaseClient(),
): Promise<string | null> {
  if (!client) return null;
  try {
    const { data, error } = await client.storage
      .from("action-icons")
      .createSignedUrl(path, ASSIGNMENT_ICON_URL_TTL_SECONDS);
    return error ? null : data?.signedUrl || null;
  } catch {
    return null;
  }
}
