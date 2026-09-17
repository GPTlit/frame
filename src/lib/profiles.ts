import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  talents: string[];
  points: number;
  contributions: number;
};

const COLUMNS = "id, username, full_name, avatar_url, talents, points, contributions";

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function saveMyProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...patch })
    .eq("id", userId);
  if (error) throw error;
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .order("points", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/** Uploads a picture to the member's own folder and returns its storage path. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Resolves a stored avatar value: full URL passes through, storage paths get signed. */
export async function resolveAvatarUrl(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(value, 3600);
  if (error) return null;
  return data.signedUrl;
}

export function displayName(p: Pick<Profile, "full_name" | "username">) {
  return p.full_name?.trim() || p.username?.trim() || "Member";
}
