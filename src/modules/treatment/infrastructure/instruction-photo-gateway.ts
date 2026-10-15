import {
  getSharedSupabaseClient,
  type AppSupabaseClient,
} from "@/core/supabase/client";

export async function resolveInstructionPhotoUrl(
  path: string,
  client: AppSupabaseClient | null = getSharedSupabaseClient(),
): Promise<string | null> {
  if (!client) return null;
  try {
    const { data, error } = await client.storage
      .from("instruction-photos")
      .createSignedUrl(path, 3600);
    return error ? null : data?.signedUrl || null;
  } catch {
    return null;
  }
}
