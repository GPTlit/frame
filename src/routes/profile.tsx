import { useEffect, useRef, useState, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Trash2,
  AlertTriangle,
  UserCheck,
  UserX,
  Users,
  MapPin,
  Globe,
  Settings,
  Pencil,
  ShieldCheck,
  CheckCircle2,
  AtSign,
  User,
  ExternalLink,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Radio,
  X,
  Share2,
  Lock,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useIsAdmin } from "@/lib/admin";
import ProfileCard from "@/components/ProfileCard";
import { t, useLang } from "@/hooks/use-lang";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/frame/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyProfile,
  resolveAvatarUrl,
  saveMyProfile,
  uploadAvatar,
  uploadCover,
  type Profile,
} from "@/lib/profiles";
import {
  getFollowCounts,
  getConnections,
  acceptConnection,
  removeConnection,
  SOCIAL_KEYS,
  type Connection,
} from "@/lib/social";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Member Profile — FRAME Mauritania" },
      {
        name: "description",
        content:
          "FRAME Mauritania member profile: identity, rank, talents, contributions and network.",
      },
      { property: "og:title", content: "Member Profile — FRAME Mauritania" },
    ],
  }),
  component: ProfilePage,
});

type RequesterItem = {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
};

export default function ProfilePage() {
  const { lang, setLang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const avatarFileRef = useRef<HTMLInputElement | null>(null);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const isAdmin = useIsAdmin();

  // Profile data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"preferences" | "privacy">("preferences");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Edit form buffer
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTalents, setEditTalents] = useState<string[]>([]);
  const [talentInput, setTalentInput] = useState("");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");

  // Social Links buffer
  const [editSocialLinks, setEditSocialLinks] = useState<Record<string, string>>({});
  const [editingSocialInModal, setEditingSocialInModal] = useState(false);

  // Social stats & network
  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number }>({
    followers: 0,
    following: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<RequesterItem[]>([]);
  const [connectionsCount, setConnectionsCount] = useState(0);

  // Account deletion
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePhone, setDeletePhone] = useState("");
  const [hasContactPhone, setHasContactPhone] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [p, counts, conns, contactRes] = await Promise.all([
        getMyProfile(user.id),
        getFollowCounts(user.id),
        getConnections(user.id),
        supabase.from("member_contacts").select("phone").eq("user_id", user.id).maybeSingle(),
      ]);

      const next: Profile = p ?? {
        id: user.id,
        username: null,
        full_name: null,
        avatar_url: null,
        cover_url: null,
        bio: null,
        location: null,
        talents: [],
        interests: [],
        social_links: {},
        show_online: true,
        points: 0,
        contributions: 0,
      };

      setProfile(next);
      setFollowCounts(counts);

      // Initialize edit buffers
      setEditName(next.full_name ?? "");
      setEditUsername(next.username ?? "");
      setEditBio(next.bio ?? "");
      setEditLocation(next.location ?? "");
      setEditTalents(next.talents ?? []);
      setEditInterests(next.interests ?? []);
      setEditSocialLinks(next.social_links ?? {});

      if (contactRes.data?.phone) {
        setHasContactPhone(contactRes.data.phone);
      }

      if (next.avatar_url) {
        setAvatarPreview(await resolveAvatarUrl(next.avatar_url));
      }
      if (next.cover_url) {
        setCoverPreview(await resolveAvatarUrl(next.cover_url));
      }

      const pending = conns.filter((c) => c.addressee === user.id && c.status === "pending");
      const accepted = conns.filter((c) => c.status === "accepted");
      setConnectionsCount(accepted.length);

      if (pending.length > 0) {
        const requesterIds = pending.map((c) => c.requester);
        const { data: requesters } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", requesterIds);

        const items: RequesterItem[] = [];
        for (const r of requesters ?? []) {
          const av = await resolveAvatarUrl(r.avatar_url);
          items.push({
            id: r.id,
            name: r.full_name || r.username || "Member",
            username: r.username,
            avatar: av,
          });
        }
        setPendingRequests(items);
      } else {
        setPendingRequests([]);
      }
    } catch {
      // non-fatal
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Save profile changes from edit modal
  const handleSaveEditProfile = async () => {
    if (!user || !profile) return;
    setBusy(true);
    try {
      const payload: Partial<Profile> = {
        full_name: editName.trim() || null,
        username: editUsername.trim().toLowerCase() || null,
        bio: editBio.trim() || null,
        location: editLocation.trim() || null,
        talents: editTalents,
        interests: editInterests,
      };
      await saveMyProfile(user.id, payload);
      setProfile((prev) => (prev ? { ...prev, ...payload } : prev));
      setEditModalOpen(false);
      setFeedbackMsg(
        t(lang, {
          en: "Profile updated successfully!",
          fr: "Profil mis à jour avec succès !",
          ar: "تم تحديث الملف الشخصي بنجاح!",
        }),
      );
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error saving profile");
    } finally {
      setBusy(false);
    }
  };

  // Save social links
  const handleSaveSocialLinks = async () => {
    if (!user || !profile) return;
    setBusy(true);
    try {
      await saveMyProfile(user.id, {
        social_links: editSocialLinks,
      });
      setProfile((prev) => (prev ? { ...prev, social_links: editSocialLinks } : prev));
      setEditingSocialInModal(false);
      setFeedbackMsg(
        t(lang, {
          en: "Social links saved!",
          fr: "Réseaux sociaux enregistrés !",
          ar: "تم حفظ الروابط بنجاح!",
        }),
      );
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error saving social links");
    } finally {
      setBusy(false);
    }
  };

  const onPickAvatar = async (file: File) => {
    if (!user) return;
    setBusy(true);
    try {
      const path = await uploadAvatar(user.id, file);
      setAvatarPreview(await resolveAvatarUrl(path));
      await saveMyProfile(user.id, { avatar_url: path });
      setProfile((prev) => (prev ? { ...prev, avatar_url: path } : prev));
      setFeedbackMsg(
        t(lang, { en: "Picture updated", fr: "Photo mise à jour", ar: "تم تحديث الصورة" }),
      );
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error uploading avatar");
    } finally {
      setBusy(false);
    }
  };

  const onPickCover = async (file: File) => {
    if (!user) return;
    setBusy(true);
    try {
      const path = await uploadCover(user.id, file);
      setCoverPreview(await resolveAvatarUrl(path));
      await saveMyProfile(user.id, { cover_url: path });
      setProfile((prev) => (prev ? { ...prev, cover_url: path } : prev));
      setFeedbackMsg(
        t(lang, { en: "Cover banner updated", fr: "Bannière mise à jour", ar: "تم تحديث الغلاف" }),
      );
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error uploading cover");
    } finally {
      setBusy(false);
    }
  };

  const handleAcceptConnection = async (requesterId: string) => {
    if (!user) return;
    try {
      await acceptConnection(requesterId, user.id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requesterId));
      setConnectionsCount((c) => c + 1);
    } catch {
      // non-fatal
    }
  };

  const handleDeclineConnection = async (requesterId: string) => {
    if (!user) return;
    try {
      await removeConnection(requesterId, user.id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requesterId));
    } catch {
      // non-fatal
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const phoneParam = deletePhone.trim() || hasContactPhone || "";
      const { error } = await supabase.rpc("delete_own_account", { _phone: phoneParam });
      if (error) {
        if (error.message.includes("phone does not match")) {
          setDeleteError(
            t(lang, {
              en: "Enter the registered phone number matching this account.",
              fr: "Entrez le numéro de téléphone exact associé à ce compte.",
              ar: "يرجى إدخال رقم الهاتف المسجل مع هذا الحساب.",
            }),
          );
          setDeleting(false);
          return;
        }
        throw error;
      }
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  };

  // 1. Loading state
  if (authLoading) {
    return (
      <main className="grid min-h-[60vh] place-items-center pt-[92px]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-maroon-accent border-t-transparent" />
      </main>
    );
  }

  // 2. Visitor / Unauthenticated view
  if (!user) {
    return (
      <main className="pt-[92px]">
        <section className="wrap py-16">
          <div className="mx-auto max-w-xl text-center">
            <div className="relative mb-6 h-48 w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-maroon-900/60 via-background to-violet-950/60">
              <div className="flex h-full w-full items-center justify-center font-display text-4xl tracking-widest text-muted-foreground/30 uppercase">
                FRAME
              </div>
            </div>
            <div className="mx-auto -mt-16 grid h-24 w-24 place-items-center rounded-full border-4 border-background bg-maroon-700 font-display text-2xl font-bold text-white shadow-xl">
              FR
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold">
              {t(lang, {
                en: "FRAME Member Profile",
                fr: "Profil Membre FRAME",
                ar: "الملف الشخصي في إطار",
              })}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(lang, {
                en: "Sign in with your phone number to personalize your profile, track arena scores, and unlock community messaging.",
                fr: "Connectez-vous avec votre numéro pour personnaliser votre profil, suivre vos points et débloquer les messages.",
                ar: "سجّل الدخول برقم هاتفك لتخصيص ملفك الشخصي ومتابعة نقاطك والمشاركة في رسائل المجتمع.",
              })}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="rounded-md bg-[image:var(--gradient-ember)] px-6 py-2.5 text-sm font-semibold text-paper shadow-md transition-transform active:scale-95"
              >
                {t(lang, {
                  en: "Sign In or Join FRAME",
                  fr: "Se connecter ou Rejoindre",
                  ar: "تسجيل الدخول أو الانضمام",
                })}
              </button>
            </div>
          </div>
        </section>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </main>
    );
  }

  const socialCount = Object.values(profile?.social_links ?? {}).filter(Boolean).length;

  return (
    <main className="pt-[92px]">
      <section className="wrap py-6">
        {feedbackMsg && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {feedbackMsg}
          </div>
        )}

        {/* Top Cover Banner */}
        <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-maroon-900/60 via-background to-violet-950/60 md:h-72 shadow-sm">
          {coverPreview ? (
            <img src={coverPreview} alt="Cover Banner" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-5xl tracking-widest text-muted-foreground/30 uppercase select-none">
              FRAME
            </div>
          )}
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickCover(f);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => coverFileRef.current?.click()}
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-lg bg-background/85 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-background shadow-md"
          >
            <Camera className="h-3.5 w-3.5 text-maroon-accent" />
            {t(lang, { en: "Change Cover", fr: "Changer la couverture", ar: "تغيير الغلاف" })}
          </button>
        </div>

        {/* Profile Header Bar: Avatar beside Name, Buttons to the Side */}
        <div className="relative px-2 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            {/* Avatar & Identity */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-16 sm:-mt-20">
              {/* Avatar with Camera Trigger */}
              <div className="relative h-28 w-28 sm:h-36 sm:w-36 shrink-0 rounded-full border-4 border-background bg-card shadow-xl overflow-hidden group">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-tr from-maroon-700 to-violet-700 font-display text-3xl font-bold text-white">
                    {(profile?.full_name || profile?.username || "FR").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onPickAvatar(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  aria-label="Upload Avatar"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                >
                  <Camera className="h-6 w-6" />
                </button>
                {profile?.show_online && (
                  <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-background bg-emerald-500 ring-1 ring-emerald-400" />
                )}
              </div>

              {/* Name & Handle Details */}
              <div className="mt-2 sm:mt-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                    {profile?.full_name ||
                      t(lang, { en: "Anonymous Member", fr: "Membre Anonyme", ar: "عضو" })}
                  </h1>
                  <span className="rounded-full bg-maroon-700/15 px-2.5 py-0.5 text-xs font-semibold text-maroon-accent">
                    {profile?.points ?? 0} pts
                  </span>
                </div>
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>@{profile?.username || "frame"}</span>
                  {profile?.location && (
                    <span className="inline-flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {profile.location}
                    </span>
                  )}
                </div>
                {profile?.bio && (
                  <p className="mt-2 text-sm text-foreground/90 max-w-xl whitespace-pre-line leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Organized Action Buttons to the Side */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5 md:mt-0">
              {/* 1. Edit Profile Button */}
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[image:var(--gradient-ember)] px-4 py-2 text-xs font-semibold text-paper shadow transition hover:opacity-95 active:scale-95"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t(lang, { en: "Edit Profile", fr: "Modifier le profil", ar: "تعديل الملف" })}
              </button>

              {/* 2. Social Links Expandable Button */}
              <button
                type="button"
                onClick={() => setSocialModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:border-maroon-accent/50 hover:bg-muted transition"
              >
                <Globe className="h-3.5 w-3.5 text-maroon-accent" />
                {t(lang, { en: "Social Links", fr: "Réseaux sociaux", ar: "حسابات التواصل" })}
                {socialCount > 0 && (
                  <span className="ml-1 rounded-full bg-maroon-700/20 px-1.5 text-[10px] text-maroon-accent font-bold">
                    {socialCount}
                  </span>
                )}
              </button>

              {/* 3. Settings Button */}
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:border-maroon-accent/50 hover:bg-muted transition"
                title={t(lang, {
                  en: "Settings & Privacy",
                  fr: "Paramètres & Confidentialité",
                  ar: "الإعدادات والخصوصية",
                })}
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                {t(lang, { en: "Settings", fr: "Paramètres", ar: "الإعدادات" })}
              </button>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="rounded-lg border border-maroon-accent px-3 py-2 text-xs font-semibold text-maroon-accent hover:bg-maroon-accent/10 transition"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(lang, { en: "Points", fr: "Points", ar: "النقاط" })}
            </span>
            <div className="mt-1 font-display text-xl font-bold text-maroon-accent">
              {profile?.points ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(lang, { en: "Contributions", fr: "Contributions", ar: "المساهمات" })}
            </span>
            <div className="mt-1 font-display text-xl font-bold">{profile?.contributions ?? 0}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(lang, { en: "Followers", fr: "Abonnés", ar: "المتابعون" })}
            </span>
            <div className="mt-1 font-display text-xl font-bold">{followCounts.followers}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(lang, { en: "Following", fr: "Abonnements", ar: "المتابعون لهم" })}
            </span>
            <div className="mt-1 font-display text-xl font-bold">{followCounts.following}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5 text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(lang, { en: "Connections", fr: "Connexions", ar: "جهات الاتصال" })}
            </span>
            <div className="mt-1 font-display text-xl font-bold">{connectionsCount}</div>
          </div>
        </div>

        {/* Incoming Connection Requests Banner */}
        {pendingRequests.length > 0 && (
          <div className="mt-8 rounded-xl border border-maroon-accent/30 bg-maroon-700/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-maroon-accent" />
              <h3 className="font-display text-lg font-bold">
                {t(lang, {
                  en: `Connection Requests (${pendingRequests.length})`,
                  fr: `Demandes de connexion (${pendingRequests.length})`,
                  ar: `طلبات التواصل (${pendingRequests.length})`,
                })}
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {req.avatar ? (
                      <img src={req.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-semibold">
                        {req.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{req.name}</div>
                      {req.username && (
                        <div className="truncate text-xs text-muted-foreground">
                          @{req.username}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      type="button"
                      onClick={() => void handleAcceptConnection(req.id)}
                      className="grid h-8 w-8 place-items-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      title={t(lang, { en: "Accept", fr: "Accepter", ar: "قبول" })}
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeclineConnection(req.id)}
                      className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted text-muted-foreground transition"
                      title={t(lang, { en: "Decline", fr: "Refuser", ar: "رفض" })}
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Content Body: Talents, Interests & Holographic Card */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Talents & Disciplines */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-bold">
                  {t(lang, {
                    en: "Talents & Arenas",
                    fr: "Talents & Disciplines",
                    ar: "المواهب والمجالات",
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="text-xs text-maroon-accent hover:underline flex items-center gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  {t(lang, { en: "Edit", fr: "Modifier", ar: "تعديل" })}
                </button>
              </div>
              {(profile?.talents ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile?.talents.map((tg) => (
                    <span key={tg} className="pc-tag">
                      {tg}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t(lang, {
                    en: "No talents listed yet. Click Edit Profile to add disciplines.",
                    fr: "Aucun talent répertorié. Cliquez sur Modifier le profil pour en ajouter.",
                    ar: "لم تتم إضافة مواهب بعد. انقر على تعديل الملف لإضافتها.",
                  })}
                </p>
              )}
            </div>

            {/* Interests & Passions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-bold">
                  {t(lang, {
                    en: "Interests & Passions",
                    fr: "Centres d'intérêt",
                    ar: "الاهتمامات والهوايات",
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="text-xs text-maroon-accent hover:underline flex items-center gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  {t(lang, { en: "Edit", fr: "Modifier", ar: "تعديل" })}
                </button>
              </div>
              {(profile?.interests ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(profile?.interests ?? []).map((inItem) => (
                    <span key={inItem} className="pc-tag">
                      {inItem}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t(lang, {
                    en: "No interests listed yet.",
                    fr: "Aucun centre d'intérêt répertorié.",
                    ar: "لم تتم إضافة اهتمامات بعد.",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Side: Holographic Card Preview */}
          <div>
            <div className="sticky top-28">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(lang, { en: "Community Card", fr: "Carte Communauté", ar: "بطاقة العضو" })}
              </span>
              <ProfileCard
                name={profile?.full_name?.trim() || "Member"}
                handle={profile?.username?.trim() || "frame"}
                title={profile?.talents[0] ?? "Talent"}
                tags={profile?.talents ?? []}
                {...(avatarPreview ? { avatarUrl: avatarPreview } : {})}
                rank={`${profile?.points ?? 0} pts`}
                contributions={profile?.contributions ?? 0}
                status={profile?.show_online ? "Online" : "Away"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 1. EDIT PROFILE MODAL -------------------- */}
      {editModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-display text-xl font-bold">
                {t(lang, {
                  en: "Edit Profile",
                  fr: "Modifier le profil",
                  ar: "تعديل الملف الشخصي",
                })}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(lang, { en: "Full name", fr: "Nom complet", ar: "الاسم الكامل" })}
                </label>
                <input
                  className="w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm outline-none focus:border-maroon-accent"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Aminetou Salem"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(lang, { en: "Username", fr: "Pseudo", ar: "اسم المستخدم" })}
                </label>
                <input
                  className="w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm outline-none focus:border-maroon-accent"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="aminetou"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(lang, { en: "Bio", fr: "Biographie", ar: "النبذة التعريفية" })}
                </label>
                <textarea
                  rows={3}
                  maxLength={280}
                  className="w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm outline-none focus:border-maroon-accent"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={t(lang, {
                    en: "Tell the community about your passions and ambition…",
                    fr: "Parlez de vos passions et de vos projets…",
                    ar: "عرّف المجتمع عن شغفك وطموحاتك…",
                  })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(lang, { en: "Location", fr: "Localisation", ar: "الموقع" })}
                </label>
                <input
                  className="w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm outline-none focus:border-maroon-accent"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Nouakchott, Mauritania"
                />
              </div>

              {/* Talents builder */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(lang, {
                    en: "Talents & Disciplines",
                    fr: "Talents & Disciplines",
                    ar: "المواهب",
                  })}
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-input bg-card px-3.5 py-2 text-sm outline-none"
                    value={talentInput}
                    onChange={(e) => setTalentInput(e.target.value)}
                    placeholder="e.g. Chess, Code, Debate"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = talentInput.trim();
                        if (v && !editTalents.includes(v)) {
                          setEditTalents([...editTalents, v]);
                          setTalentInput("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = talentInput.trim();
                      if (v && !editTalents.includes(v)) {
                        setEditTalents([...editTalents, v]);
                        setTalentInput("");
                      }
                    }}
                    className="rounded-md bg-secondary px-3.5 py-2 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                {editTalents.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {editTalents.map((tg) => (
                      <button
                        key={tg}
                        type="button"
                        onClick={() => setEditTalents(editTalents.filter((x) => x !== tg))}
                        className="pc-tag text-xs"
                      >
                        {tg} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Interests builder */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(lang, {
                    en: "Interests & Passions",
                    fr: "Centres d'intérêt",
                    ar: "الاهتمامات",
                  })}
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-input bg-card px-3.5 py-2 text-sm outline-none"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="e.g. AI, Sports, Poetry"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = interestInput.trim();
                        if (v && !editInterests.includes(v)) {
                          setEditInterests([...editInterests, v]);
                          setInterestInput("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = interestInput.trim();
                      if (v && !editInterests.includes(v)) {
                        setEditInterests([...editInterests, v]);
                        setInterestInput("");
                      }
                    }}
                    className="rounded-md bg-secondary px-3.5 py-2 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                {editInterests.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {editInterests.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setEditInterests(editInterests.filter((x) => x !== item))}
                        className="pc-tag text-xs"
                      >
                        {item} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                {t(lang, { en: "Cancel", fr: "Annuler", ar: "إلغاء" })}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSaveEditProfile()}
                className="rounded-md bg-[image:var(--gradient-ember)] px-5 py-2 text-xs font-semibold text-paper shadow disabled:opacity-60"
              >
                {t(lang, { en: "Save Changes", fr: "Enregistrer", ar: "حفظ التغييرات" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. SOCIAL LINKS EXPANDABLE MODAL -------------------- */}
      {socialModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-maroon-accent" />
                <h3 className="font-display text-xl font-bold">
                  {t(lang, { en: "Social Profiles", fr: "Réseaux sociaux", ar: "حسابات التواصل" })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSocialModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {!editingSocialInModal ? (
                <>
                  {SOCIAL_KEYS.map((key) => {
                    const link = profile?.social_links?.[key];
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {key}
                        </span>
                        {link ? (
                          <a
                            href={link.startsWith("http") ? link : `https://${link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-maroon-accent hover:underline font-medium"
                          >
                            <span className="truncate max-w-[200px]">{link}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">
                            {t(lang, { en: "Not connected", fr: "Non connecté", ar: "غير مضاف" })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="mt-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingSocialInModal(true)}
                      className="w-full rounded-md bg-[image:var(--gradient-ember)] py-2 text-xs font-semibold text-paper shadow"
                    >
                      {t(lang, { en: "Edit Links", fr: "Modifier les liens", ar: "تعديل الروابط" })}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {SOCIAL_KEYS.map((key) => (
                    <div key={key}>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                        {key}
                      </label>
                      <input
                        className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-maroon-accent"
                        value={editSocialLinks[key] ?? ""}
                        onChange={(e) =>
                          setEditSocialLinks({ ...editSocialLinks, [key]: e.target.value })
                        }
                        placeholder={`https://${key}.com/username`}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingSocialInModal(false)}
                      className="flex-1 rounded-md border border-border py-2 text-xs font-semibold hover:bg-muted"
                    >
                      {t(lang, { en: "Back", fr: "Retour", ar: "رجوع" })}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleSaveSocialLinks()}
                      className="flex-1 rounded-md bg-[image:var(--gradient-ember)] py-2 text-xs font-semibold text-paper shadow"
                    >
                      {t(lang, { en: "Save Links", fr: "Enregistrer", ar: "حفظ الروابط" })}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 3. SETTINGS & PRIVACY CENTER MODAL -------------------- */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-display text-xl font-bold">
                  {t(lang, { en: "Settings", fr: "Paramètres", ar: "الإعدادات" })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-tabs: Preferences vs Privacy Center */}
            <div className="mt-4 flex rounded-lg border border-border p-1 bg-muted/40">
              <button
                type="button"
                onClick={() => setSettingsTab("preferences")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  settingsTab === "preferences"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground"
                }`}
              >
                {t(lang, { en: "Preferences", fr: "Préférences", ar: "التفضيلات" })}
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("privacy")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  settingsTab === "privacy"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground"
                }`}
              >
                {t(lang, { en: "Privacy Center", fr: "Confidentialité", ar: "مركز الخصوصية" })}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {settingsTab === "preferences" ? (
                <>
                  {/* Language */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(lang, { en: "Language", fr: "Langue", ar: "اللغة" })}
                    </span>
                    <div className="flex gap-1">
                      {(["en", "fr", "ar"] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLang(l)}
                          className={`rounded px-2.5 py-1 text-xs font-bold uppercase transition ${
                            lang === l
                              ? "bg-[image:var(--gradient-ember)] text-paper"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sign out */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => void supabase.auth.signOut()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      {t(lang, { en: "Sign Out", fr: "Se déconnecter", ar: "تسجيل الخروج" })}
                    </button>
                  </div>
                </>
              ) : (
                /* Privacy Center */
                <>
                  {/* Online Presence Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {t(lang, {
                          en: "Show Online Status",
                          fr: "Statut en ligne",
                          ar: "إظهار حالة الاتصال",
                        })}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t(lang, {
                          en: "Show green active status to members",
                          fr: "Afficher le statut actif aux membres",
                          ar: "إظهار النقطة الخضراء عند اتصالك",
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const next = !profile?.show_online;
                        await saveMyProfile(user.id, { show_online: next });
                        setProfile((prev) => (prev ? { ...prev, show_online: next } : prev));
                      }}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        profile?.show_online ? "bg-emerald-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          profile?.show_online ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Danger Zone: Account Deletion */}
                  <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 mt-4">
                    <div className="flex items-center gap-2 text-destructive font-semibold text-xs uppercase tracking-wider">
                      <Lock className="h-4 w-4" />
                      {t(lang, { en: "Danger Zone", fr: "Zone critique", ar: "منطقة الخطر" })}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(lang, {
                        en: "Permanently erase your account, messages, points and presence.",
                        fr: "Supprimer définitivement votre compte, messages et points.",
                        ar: "محو حسابك ورسائلك ونقاطك نهائياً من منصة إطار.",
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteModalOpen(true);
                        setDeleteConfirmText("");
                        setDeleteError(null);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-destructive px-3.5 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t(lang, {
                        en: "Delete My Account",
                        fr: "Supprimer mon compte",
                        ar: "حذف حسابي نهائياً",
                      })}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 4. ACCOUNT DELETION CONFIRMATION MODAL -------------------- */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-destructive/50 bg-background p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-display text-xl font-bold">
                {t(lang, {
                  en: "Delete Account Permanently?",
                  fr: "Supprimer définitivement ?",
                  ar: "تأكيد حذف الحساب؟",
                })}
              </h3>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              {t(lang, {
                en: "This action cannot be undone. All your scores, messages, friendships and data will be erased immediately.",
                fr: "Cette action est irréversible. Tous vos scores, messages et données seront effacés.",
                ar: "هذا الإجراء لا يمكن التراجع عنه. سيتم مسح كافة مشاركاتك ورسائلك وبياناتك فوراً.",
              })}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  {t(lang, {
                    en: 'Type "DELETE" to confirm:',
                    fr: 'Tapez "DELETE" pour confirmer :',
                    ar: 'اكتب "DELETE" للتأكيد:',
                  })}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-destructive font-mono"
                />
              </div>

              {hasContactPhone && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t(lang, {
                      en: "Confirm registered phone number:",
                      fr: "Confirmez le numéro de téléphone :",
                      ar: "أكد رقم الهاتف المسجل:",
                    })}
                  </label>
                  <input
                    type="tel"
                    value={deletePhone}
                    onChange={(e) => setDeletePhone(e.target.value)}
                    placeholder={hasContactPhone}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs outline-none"
                  />
                </div>
              )}

              {deleteError && (
                <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-md border border-border px-3.5 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                {t(lang, { en: "Cancel", fr: "Annuler", ar: "إلغاء" })}
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "DELETE" || deleting}
                onClick={() => void handleDeleteAccount()}
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
              >
                {deleting && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {t(lang, { en: "Confirm Delete", fr: "Supprimer", ar: "تأكيد الحذف" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
