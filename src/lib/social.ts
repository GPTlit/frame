import { supabase } from "@/integrations/supabase/client";

export type FullProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  location: string | null;
  talents: string[];
  interests: string[];
  social_links: Record<string, string>;
  show_online: boolean;
  last_seen: string | null;
  points: number;
  contributions: number;
  created_at?: string;
};

export const FULL_COLUMNS =
  "id, username, full_name, avatar_url, cover_url, bio, location, talents, interests, social_links, show_online, last_seen, points, contributions, created_at";

export const SOCIAL_KEYS = ["instagram", "x", "tiktok", "youtube", "linkedin", "github", "website"] as const;

/* ---------- signed URL cache (keeps media fast and avoids re-signing) ---------- */
const urlCache = new Map<string, { url: string; exp: number }>();

export async function signedUrl(bucket: string, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  const key = `${bucket}/${path}`;
  const hit = urlCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 6);
  if (error || !data) return null;
  urlCache.set(key, { url: data.signedUrl, exp: Date.now() + 1000 * 60 * 60 * 5 });
  return data.signedUrl;
}

/* ---------- profiles ---------- */
export async function getProfileByUsername(username: string): Promise<FullProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(FULL_COLUMNS)
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data as FullProfile | null;
}

export async function getProfileById(id: string): Promise<FullProfile | null> {
  const { data, error } = await supabase.from("profiles").select(FULL_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as FullProfile | null;
}

export async function listAllProfiles(): Promise<FullProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(FULL_COLUMNS)
    .order("points", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as FullProfile[];
}

export function profileCompletion(p: FullProfile) {
  const checks = [
    !!p.full_name,
    !!p.username,
    !!p.avatar_url,
    !!p.cover_url,
    !!p.bio,
    !!p.location,
    p.talents.length > 0,
    p.interests.length > 0,
    Object.values(p.social_links ?? {}).some(Boolean),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function lastSeenLabel(p: Pick<FullProfile, "show_online" | "last_seen">, online: boolean) {
  if (!p.show_online) return null;
  if (online) return "online";
  if (!p.last_seen) return null;
  const mins = Math.round((Date.now() - new Date(p.last_seen).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* ---------- social graph ---------- */
export type Connection = { requester: string; addressee: string; status: string };

export async function getConnections(userId: string): Promise<Connection[]> {
  const { data, error } = await supabase
    .from("connections")
    .select("requester, addressee, status")
    .or(`requester.eq.${userId},addressee.eq.${userId}`);
  if (error) throw error;
  return data ?? [];
}

export function friendIds(userId: string, conns: Connection[]) {
  return conns
    .filter((c) => c.status === "accepted")
    .map((c) => (c.requester === userId ? c.addressee : c.requester));
}

export async function requestConnection(me: string, other: string) {
  const { error } = await supabase.from("connections").insert({ requester: me, addressee: other });
  if (error) throw error;
}
export async function acceptConnection(requester: string, me: string) {
  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("requester", requester)
    .eq("addressee", me);
  if (error) throw error;
}
export async function removeConnection(a: string, b: string) {
  await supabase.from("connections").delete().eq("requester", a).eq("addressee", b);
  await supabase.from("connections").delete().eq("requester", b).eq("addressee", a);
}

export async function getFollowCounts(userId: string) {
  const [a, b] = await Promise.all([
    supabase.from("follows").select("follower", { count: "exact", head: true }).eq("following", userId),
    supabase.from("follows").select("following", { count: "exact", head: true }).eq("follower", userId),
  ]);
  return { followers: a.count ?? 0, following: b.count ?? 0 };
}
export async function isFollowing(me: string, other: string) {
  const { data } = await supabase.from("follows").select("follower").eq("follower", me).eq("following", other).maybeSingle();
  return !!data;
}
export async function setFollow(me: string, other: string, on: boolean) {
  if (on) await supabase.from("follows").insert({ follower: me, following: other });
  else await supabase.from("follows").delete().eq("follower", me).eq("following", other);
}

export async function isBlocked(me: string, other: string) {
  const { data } = await supabase.from("blocks").select("blocker").eq("blocker", me).eq("blocked", other).maybeSingle();
  return !!data;
}
export async function setBlock(me: string, other: string, on: boolean) {
  if (on) await supabase.from("blocks").insert({ blocker: me, blocked: other });
  else await supabase.from("blocks").delete().eq("blocker", me).eq("blocked", other);
}
export async function report(me: string, reason: string, target?: string, messageId?: string) {
  const { error } = await supabase
    .from("reports")
    .insert({ reporter: me, reason, target_user: target ?? null, message_id: messageId ?? null });
  if (error) throw error;
}

/* ---------- conversations ---------- */
export type Conversation = {
  id: string;
  is_group: boolean;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  category: string | null;
  is_public: boolean;
  invite_code: string;
  created_by: string;
  last_message_at: string;
};

export type Membership = {
  conversation_id: string;
  user_id: string;
  role: string;
  last_read_at: string;
  pinned: boolean;
  archived: boolean;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  kind: "text" | "image" | "video" | "audio" | "file" | "share";
  media_path: string | null;
  media_name: string | null;
  shared: { type: string; id: string; title: string; link: string } | null;
  reply_to: string | null;
  pinned: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type Reaction = { message_id: string; user_id: string; emoji: string };

export async function startDirect(other: string): Promise<string> {
  const { data, error } = await supabase.rpc("start_direct", { _other: other });
  if (error) throw error;
  return data as string;
}

export async function createGroup(input: {
  title: string;
  description: string;
  avatar: string | null;
  category: string;
  isPublic: boolean;
  members: string[];
}): Promise<string> {
  const { data, error } = await supabase.rpc("create_group", {
    _title: input.title,
    _description: input.description,
    _avatar: input.avatar ?? "",
    _category: input.category,
    _is_public: input.isPublic,
    _members: input.members,
  });
  if (error) throw error;
  return data as string;
}

export const MAX_UPLOAD = 50 * 1024 * 1024;
const ALLOWED = /^(image\/|video\/|audio\/|application\/pdf|application\/zip|text\/plain|application\/vnd\.|application\/msword)/;

export function validateUpload(file: File): string | null {
  if (file.size > MAX_UPLOAD) return "File is larger than 50 MB";
  if (!ALLOWED.test(file.type || "")) return "This file type is not allowed";
  return null;
}

export function kindForFile(file: File): Message["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

export async function uploadChatFile(convId: string, userId: string, file: File | Blob, name: string) {
  const safe = name.replace(/[^\w.-]+/g, "_").slice(-80);
  const path = `${convId}/${userId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, file, { contentType: (file as File).type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

export async function uploadGroupPicture(file: File) {
  const path = `groups/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

/** Converts any YouTube link (watch, youtu.be, shorts, embed) into its video id. */
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}
