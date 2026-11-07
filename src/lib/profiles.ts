import { signedUrl } from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  cover_url?: string | null | undefined;
  bio?: string | null | undefined;
  location?: string | null | undefined;
  talents: string[];
  interests?: string[] | undefined;
  social_links?: Record<string, string> | undefined;
  show_online?: boolean | undefined;
  last_seen?: string | null | undefined;
  points: number;
  contributions: number;
};

const COLUMNS =
  "id, username, full_name, avatar_url, cover_url, bio, location, talents, interests, social_links, show_online, last_seen, points, contributions";

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
  const updatePayload: Record<string, unknown> = { id: userId };
  for (const [key, val] of Object.entries(patch)) {
    if (val !== undefined) {
      updatePayload[key] = val;
    }
  }
  const { error } = await supabase
    .from("profiles")
    .upsert(updatePayload as never)
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

/** Uploads a cover photo to the member's folder. */
export async function uploadCover(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/cover-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Resolves a stored avatar value into a viewable URL that works on any host. */
export async function resolveAvatarUrl(value: string | null): Promise<string | null> {
  if (!value) return null;
  const m = value.match(/\/storage\/v1\/object\/(?:public|sign)\/avatars\/([^?]+)/);
  if (m?.[1]) return signedUrl("avatars", decodeURIComponent(m[1]));
  if (/^(https?:|data:|blob:)/.test(value)) return value;
  return signedUrl("avatars", value.replace(/^avatars\//, "").replace(/^\/+/, ""));
}

export function displayName(p: Pick<Profile, "full_name" | "username">) {
  return p.full_name?.trim() || p.username?.trim() || "Member";
}
