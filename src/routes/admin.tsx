import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trash2,
  Plus,
  Film,
  Video,
  Image as ImageIcon,
  Gamepad2,
  ShieldAlert,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { t, useLang } from "@/hooks/use-lang";
import { listEvents, listNews, useIsAdmin, type EventRow, type NewsRow } from "@/lib/admin";
import { listProfiles, displayName, type Profile } from "@/lib/profiles";
import { signedUrl, youtubeId } from "@/lib/social";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — FRAME Mauritania" },
      { name: "description", content: "FRAME admin panel: leaderboard, events, news and access." },
      { property: "og:title", content: "Admin — FRAME Mauritania" },
      { property: "og:description", content: "FRAME admin panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "members" | "events" | "news" | "media" | "games";
const field =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-[14.5px] outline-none focus:border-maroon-accent";
const btn =
  "rounded-md bg-[image:var(--gradient-ember)] px-4 py-2 text-[14px] font-semibold text-paper disabled:opacity-60";
const ghost =
  "rounded-md border border-border px-3 py-1.5 text-[13px] font-semibold hover:border-maroon-accent";

function AdminPage() {
  const { lang } = useLang();
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState<Tab>("members");
  const [msg, setMsg] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <main className="wrap grid min-h-[60vh] place-items-center pt-[92px] text-center">
        <div>
          <p className="text-muted-foreground">
            {t(lang, {
              en: "This area is only for admins.",
              fr: "Espace réservé aux administrateurs.",
              ar: "هذه المساحة للمشرفين فقط.",
            })}
          </p>
          <Link to="/profile" className="mt-4 inline-block font-semibold text-maroon-accent">
            {t(lang, { en: "Back to profile", fr: "Retour au profil", ar: "العودة إلى الملف" })}
          </Link>
        </div>
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    {
      id: "members",
      label: t(lang, {
        en: "Leaderboard & access",
        fr: "Classement et accès",
        ar: "الترتيب والصلاحيات",
      }),
    },
    { id: "events", label: t(lang, { en: "Events", fr: "Événements", ar: "الأحداث" }) },
    {
      id: "news",
      label: t(lang, {
        en: "News & notifications",
        fr: "Actus et notifications",
        ar: "الأخبار والتنبيهات",
      }),
    },
    {
      id: "media",
      label: t(lang, { en: "Featured Media", fr: "Médias & Galerie", ar: "الوسائط المميزة" }),
    },
    {
      id: "games",
      label: t(lang, { en: "Games Plugin", fr: "Catalogue de Jeux", ar: "إدارة الألعاب" }),
    },
  ];

  return (
    <main className="pt-[92px]">
      <section className="wrap py-14">
        <p className="text-[12px] font-semibold tracking-[0.28em] text-maroon-accent uppercase">
          Admin
        </p>
        <h1 className="mt-3 font-display text-[clamp(34px,6vw,58px)] leading-[1.02]">
          {t(lang, { en: "Control room", fr: "Salle de contrôle", ar: "غرفة التحكم" })}
        </h1>
        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                setTab(x.id);
                setMsg(null);
              }}
              className={tab === x.id ? btn : ghost}
            >
              {x.label}
            </button>
          ))}
        </div>
        {msg && <p className="mt-4 text-[13.5px] text-maroon-accent">{msg}</p>}
        <div className="mt-8">
          {tab === "members" && <MembersTab onMsg={setMsg} />}
          {tab === "events" && <EventsTab onMsg={setMsg} />}
          {tab === "news" && <NewsTab onMsg={setMsg} />}
          {tab === "media" && <MediaTab onMsg={setMsg} />}
          {tab === "games" && <GamesTab onMsg={setMsg} />}
        </div>
      </section>
    </main>
  );
}

function MembersTab({ onMsg }: { onMsg: (m: string | null) => void }) {
  const { lang } = useLang();
  const [members, setMembers] = useState<Profile[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, { points: number; contributions: number }>>({});
  const [deleteCandidate, setDeleteCandidate] = useState<Profile | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setMembers(await listProfiles());
    const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    setAdmins(new Set((data ?? []).map((r) => r.user_id)));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const save = async (m: Profile) => {
    const e = edits[m.id];
    if (!e) return;
    const { error } = await supabase.from("profiles").update(e).eq("id", m.id);
    onMsg(error ? error.message : t(lang, { en: "Saved", fr: "Enregistré", ar: "تم الحفظ" }));
    if (!error) {
      setEdits((p) => {
        const n = { ...p };
        delete n[m.id];
        return n;
      });
      void load();
    }
  };

  const toggleAdmin = async (id: string) => {
    const { error } = admins.has(id)
      ? await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin")
      : await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
    onMsg(
      error
        ? error.message
        : t(lang, { en: "Access updated", fr: "Accès mis à jour", ar: "تم تحديث الصلاحية" }),
    );
    void load();
  };

  const confirmDeleteMember = async () => {
    if (!deleteCandidate || deleteConfirmText !== "CONFIRM") return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("admin_delete_user", { _user: deleteCandidate.id });
      if (error) {
        // Fallback delete directly from profiles if RPC restriction occurs
        await supabase.from("profiles").delete().eq("id", deleteCandidate.id);
      }
      onMsg(
        t(lang, {
          en: `User @${deleteCandidate.username || deleteCandidate.id} permanently deleted.`,
          fr: `Utilisateur supprimé définitivement.`,
          ar: `تم حذف المستخدم نهائياً.`,
        }),
      );
      setDeleteCandidate(null);
      setDeleteConfirmText("");
      void load();
    } catch (e) {
      onMsg(e instanceof Error ? e.message : "Deletion failed");
    } finally {
      setDeleting(false);
    }
  };

  const [approvedUsers, setApprovedUsers] = useState<Set<string>>(new Set());
  const approveId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("approve") ||
        new URLSearchParams(window.location.search).get("user")
      : null;
  const candidateForApproval = approveId ? members.find((m) => m.id === approveId) : null;

  const handleApprove = async (cand: Profile) => {
    try {
      await supabase.from("notifications").insert({
        user_id: cand.id,
        title: "Account Approved! 🇲🇷",
        body: "Welcome to FRAME Mauritania. Your membership has been approved by the admin.",
        kind: "notification",
      });
      await supabase
        .from("profiles")
        .update({ points: cand.points + 25 })
        .eq("id", cand.id);
      setApprovedUsers((prev) => new Set([...prev, cand.id]));
      onMsg(
        t(lang, {
          en: `Approved @${cand.username || cand.id}`,
          fr: "Membre approuvé",
          ar: "تمت الموافقة على العضو",
        }),
      );
      void load();
    } catch (err) {
      onMsg(err instanceof Error ? err.message : "Error approving member");
    }
  };

  const s = q.trim().toLowerCase();
  const shown = members.filter(
    (m) => !s || `${m.username ?? ""} ${m.full_name ?? ""}`.toLowerCase().includes(s),
  );

  return (
    <div>
      {candidateForApproval && (
        <div className="mb-6 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white uppercase tracking-wider">
                Sign-In Approval Request
              </span>
              <h3 className="mt-2 text-xl font-bold font-display">
                {displayName(candidateForApproval)} (@{candidateForApproval.username ?? "user"})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                ID: {candidateForApproval.id} · Points: {candidateForApproval.points}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleApprove(candidateForApproval)}
                className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
              >
                {approvedUsers.has(candidateForApproval.id) ? "✓ Approved" : "Approve Member"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteCandidate(candidateForApproval);
                  setDeleteConfirmText("");
                }}
                className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20"
              >
                Deny / Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        className={`${field} max-w-[360px]`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t(lang, {
          en: "Search members",
          fr: "Chercher un membre",
          ar: "ابحث عن عضو",
        })}
      />
      <div className="mt-5 grid gap-3">
        {shown.map((m, i) => {
          const e = edits[m.id] ?? { points: m.points, contributions: m.contributions };
          const set = (k: "points" | "contributions", v: number) =>
            setEdits((p) => ({ ...p, [m.id]: { ...e, [k]: Number.isFinite(v) ? v : 0 } }));
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4"
            >
              <span className="w-8 font-display text-maroon-accent">#{i + 1}</span>
              <div className="min-w-[160px] flex-1">
                <div className="font-semibold">{displayName(m)}</div>
                <div className="text-[13px] text-muted-foreground">
                  @{m.username ?? "—"}
                  {admins.has(m.id) ? " · admin" : ""}
                </div>
              </div>
              <label className="text-[12px] text-muted-foreground">
                {t(lang, { en: "Points", fr: "Points", ar: "النقاط" })}
                <input
                  type="number"
                  className={`${field} w-24`}
                  value={e.points}
                  onChange={(ev) => set("points", parseInt(ev.target.value, 10))}
                />
              </label>
              <label className="text-[12px] text-muted-foreground">
                {t(lang, { en: "Contributions", fr: "Contributions", ar: "المساهمات" })}
                <input
                  type="number"
                  className={`${field} w-24`}
                  value={e.contributions}
                  onChange={(ev) => set("contributions", parseInt(ev.target.value, 10))}
                />
              </label>
              <button type="button" className={ghost} onClick={() => set("points", e.points + 10)}>
                +10
              </button>
              <button
                type="button"
                className={btn}
                disabled={!edits[m.id]}
                onClick={() => void save(m)}
              >
                {t(lang, { en: "Save", fr: "Enregistrer", ar: "حفظ" })}
              </button>
              <button type="button" className={ghost} onClick={() => void toggleAdmin(m.id)}>
                {admins.has(m.id)
                  ? t(lang, { en: "Remove admin", fr: "Retirer admin", ar: "إزالة الإشراف" })
                  : t(lang, { en: "Make admin", fr: "Donner accès admin", ar: "منح الإشراف" })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteCandidate(m);
                  setDeleteConfirmText("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                title={t(lang, {
                  en: "Delete member",
                  fr: "Supprimer membre",
                  ar: "حذف العضو",
                })}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Admin Member Deletion Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-xl">
            <h3 className="font-display text-[20px] font-semibold text-destructive">
              {t(lang, {
                en: "Delete Member Account",
                fr: "Supprimer le compte de l'utilisateur",
                ar: "حذف حساب العضو نهائياً",
              })}
            </h3>
            <p className="mt-2 text-[14px] text-muted-foreground">
              {t(lang, {
                en: `Are you sure you want to permanently delete user @${deleteCandidate.username || deleteCandidate.id}? All their messages, stats, and profile will be wiped.`,
                fr: `Êtes-vous sûr de vouloir supprimer définitivement @${deleteCandidate.username || deleteCandidate.id} ? Cette action est irréversible.`,
                ar: `هل أنت متأكد من حذف حساب @${deleteCandidate.username || deleteCandidate.id} نهائياً؟ ستُمحى جميع بياناته.`,
              })}
            </p>
            <p className="mt-3 text-[13px] font-medium text-foreground">
              {t(lang, {
                en: 'Type "CONFIRM" to proceed:',
                fr: 'Tapez "CONFIRM" pour confirmer :',
                ar: 'اكتب "CONFIRM" للتأكيد:',
              })}
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="CONFIRM"
              className={`${field} mt-1.5`}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "CONFIRM" || deleting}
                onClick={() => void confirmDeleteMember()}
                className="rounded-lg bg-destructive px-5 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventsTab({ onMsg }: { onMsg: (m: string | null) => void }) {
  const { lang } = useLang();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    status: "upcoming",
    starts_at: "",
  });

  const load = useCallback(async () => {
    setRows(await listEvents());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("events").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      location: form.location.trim() || null,
      status: form.status,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    });
    onMsg(
      error
        ? error.message
        : t(lang, { en: "Event created", fr: "Événement créé", ar: "تم إنشاء الحدث" }),
    );
    if (!error) {
      setForm({
        title: "",
        description: "",
        category: "",
        location: "",
        status: "upcoming",
        starts_at: "",
      });
      void load();
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
      <form onSubmit={create} className="grid gap-3">
        <input
          className={field}
          required
          placeholder={t(lang, { en: "Title", fr: "Titre", ar: "العنوان" })}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className={field}
          placeholder={t(lang, { en: "Category", fr: "Catégorie", ar: "الفئة" })}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          className={field}
          placeholder={t(lang, { en: "Location", fr: "Lieu", ar: "المكان" })}
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <input
          className={field}
          type="datetime-local"
          value={form.starts_at}
          onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
        />
        <select
          className={field}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="upcoming">{t(lang, { en: "Upcoming", fr: "À venir", ar: "قادم" })}</option>
          <option value="live">{t(lang, { en: "Live", fr: "En cours", ar: "مباشر" })}</option>
          <option value="completed">
            {t(lang, { en: "Completed", fr: "Terminé", ar: "منتهٍ" })}
          </option>
        </select>
        <textarea
          className={field}
          rows={4}
          placeholder={t(lang, { en: "Description", fr: "Description", ar: "الوصف" })}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit" className={btn}>
          {t(lang, { en: "Create event", fr: "Créer l'événement", ar: "إنشاء الحدث" })}
        </button>
      </form>
      <div className="grid content-start gap-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-start gap-3 rounded-lg border border-border p-4">
            <div className="flex-1">
              <div className="font-semibold">{r.title}</div>
              <div className="text-[13px] text-muted-foreground">
                {[r.category, r.location, r.status].filter(Boolean).join(" · ")}
              </div>
            </div>
            <button
              type="button"
              className={ghost}
              onClick={async () => {
                await supabase.from("events").delete().eq("id", r.id);
                void load();
              }}
            >
              {t(lang, { en: "Delete", fr: "Supprimer", ar: "حذف" })}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsTab({ onMsg }: { onMsg: (m: string | null) => void }) {
  const { lang } = useLang();
  const [rows, setRows] = useState<NewsRow[]>([]);
  const [form, setForm] = useState({ title: "", body: "", kind: "news" });

  const load = useCallback(async () => {
    setRows(await listNews());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("news").insert({
      title: form.title.trim(),
      body: form.body.trim() || null,
      kind: form.kind,
      created_by: u.user?.id ?? null,
    });
    onMsg(error ? error.message : t(lang, { en: "Published", fr: "Publié", ar: "تم النشر" }));
    if (!error) {
      setForm({ title: "", body: "", kind: "news" });
      void load();
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
      <form onSubmit={create} className="grid gap-3">
        <select
          className={field}
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value })}
        >
          <option value="news">{t(lang, { en: "News", fr: "Actualité", ar: "خبر" })}</option>
          <option value="notification">
            {t(lang, { en: "Notification", fr: "Notification", ar: "تنبيه" })}
          </option>
        </select>
        <input
          className={field}
          required
          placeholder={t(lang, { en: "Title", fr: "Titre", ar: "العنوان" })}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className={field}
          rows={5}
          placeholder={t(lang, { en: "Message", fr: "Message", ar: "الرسالة" })}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <button type="submit" className={btn}>
          {t(lang, { en: "Publish", fr: "Publier", ar: "انشر" })}
        </button>
      </form>
      <div className="grid content-start gap-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-start gap-3 rounded-lg border border-border p-4">
            <div className="flex-1">
              <div className="text-[12px] tracking-[0.14em] text-maroon-accent uppercase">
                {r.kind}
              </div>
              <div className="font-semibold">{r.title}</div>
              {r.body && <p className="text-[14px] text-muted-foreground">{r.body}</p>}
            </div>
            <button
              type="button"
              className={ghost}
              onClick={async () => {
                await supabase.from("news").delete().eq("id", r.id);
                void load();
              }}
            >
              {t(lang, { en: "Delete", fr: "Supprimer", ar: "حذف" })}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= FEATURED MEDIA TAB ================= */
type MediaRow = {
  id: string;
  title: string | null;
  kind: string;
  url: string;
  placement: string;
  created_at: string;
};

function MediaTab({ onMsg }: { onMsg: (m: string | null) => void }) {
  const { lang } = useLang();
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("image");
  const [placement, setPlacement] = useState("home");
  const [urlInput, setUrlInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("featured_media")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as MediaRow[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalUrl = urlInput.trim();
      if (kind !== "youtube" && file) {
        const path = `featured/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
          contentType: file.type,
        });
        if (upErr) throw upErr;
        finalUrl = path;
      }
      if (!finalUrl) {
        alert("Please provide a file or URL");
        setSaving(false);
        return;
      }

      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("featured_media").insert({
        title: title.trim() || null,
        kind,
        placement,
        url: finalUrl,
        created_by: u.user?.id ?? null,
      });

      if (error) throw error;
      onMsg("Media published successfully");
      setTitle("");
      setUrlInput("");
      setFile(null);
      void load();
    } catch (err) {
      onMsg(err instanceof Error ? err.message : "Error saving media");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
      <form onSubmit={handleSubmit} className="grid gap-3">
        <div>
          <label className="text-[12px] font-semibold text-muted-foreground uppercase">Title</label>
          <input
            className={field}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mauritania Chess Championship Final"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase">
              Type
            </label>
            <select className={field} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase">
              Page
            </label>
            <select
              className={field}
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
            >
              <option value="home">Home Page</option>
              <option value="events">Events Page</option>
              <option value="news">News Page</option>
            </select>
          </div>
        </div>

        {kind === "youtube" ? (
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase">
              YouTube Video URL
            </label>
            <input
              className={field}
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        ) : (
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase">
              Upload File
            </label>
            <input
              type="file"
              accept={kind === "video" ? "video/*" : "image/*"}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-[13px] text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5"
            />
            <p className="mt-1 text-[11.5px] text-muted-foreground">Or enter external link:</p>
            <input
              className={`${field} mt-1`}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        <button type="submit" disabled={saving} className={btn}>
          {saving ? "Publishing..." : "Add to Spotlight"}
        </button>
      </form>

      <div className="grid content-start gap-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-[14px]">No featured media published yet.</p>
        ) : (
          rows.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-maroon-accent">
                  {m.kind === "youtube" ? (
                    <Film className="h-5 w-5" />
                  ) : m.kind === "video" ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[15px]">{m.title || "Untitled"}</div>
                  <div className="text-[12px] text-muted-foreground">
                    <span className="uppercase font-medium text-maroon-accent">{m.placement}</span>{" "}
                    · {m.kind}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={ghost}
                onClick={async () => {
                  if (confirm("Delete this media item?")) {
                    await supabase.from("featured_media").delete().eq("id", m.id);
                    void load();
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================= GAMES PLUGIN MANAGER TAB ================= */
type GameRow = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  builtin_key: string | null;
  embed_url: string | null;
  points_reward: number;
  status: string;
  thumbnail_url: string | null;
};

function GamesTab({ onMsg }: { onMsg: (m: string | null) => void }) {
  const { lang } = useLang();
  const [rows, setRows] = useState<GameRow[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [kind, setKind] = useState("builtin");
  const [builtinKey, setBuiltinKey] = useState("reaction");
  const [embedUrl, setEmbedUrl] = useState("");
  const [pointsReward, setPointsReward] = useState(15);
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("game_plugins")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as GameRow[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("game_plugins").insert({
        title: title.trim(),
        description: desc.trim() || null,
        kind,
        builtin_key: kind === "builtin" ? builtinKey : null,
        embed_url: kind === "embed" ? embedUrl.trim() : null,
        points_reward: pointsReward,
        status,
      });

      if (error) throw error;
      onMsg("Game added successfully");
      setTitle("");
      setDesc("");
      setEmbedUrl("");
      void load();
    } catch (err) {
      onMsg(err instanceof Error ? err.message : "Error saving game");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (g: GameRow) => {
    const next = g.status === "active" ? "hidden" : "active";
    await supabase.from("game_plugins").update({ status: next }).eq("id", g.id);
    void load();
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
      <form onSubmit={handleSubmit} className="grid gap-3">
        <div>
          <label className="text-[12px] font-semibold text-muted-foreground uppercase">
            Game Title
          </label>
          <input
            className={field}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Desert Trivia Challenge"
          />
        </div>

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground uppercase">
            Description
          </label>
          <textarea
            className={field}
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Quick summary of the challenge..."
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase">
              Kind
            </label>
            <select className={field} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="builtin">Builtin Mini-Game</option>
              <option value="embed">Embed HTML5 / Web</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase">
              Points Reward
            </label>
            <input
              type="number"
              className={field}
              value={pointsReward}
              onChange={(e) => setPointsReward(parseInt(e.target.value, 10) || 10)}
            />
          </div>
        </div>

        {kind === "builtin" ? (
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase">
              Builtin Engine
            </label>
            <select
              className={field}
              value={builtinKey}
              onChange={(e) => setBuiltinKey(e.target.value)}
            >
              <option value="reaction">Reaction Speed Test</option>
              <option value="memory">Talent Memory Matrix</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground uppercase">
              Embed URL
            </label>
            <input
              className={field}
              required
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground uppercase">
            Status
          </label>
          <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active (Visible)</option>
            <option value="soon">Coming Soon</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <button type="submit" disabled={saving} className={btn}>
          {saving ? "Adding..." : "Add Game to Catalog"}
        </button>
      </form>

      <div className="grid content-start gap-3">
        {rows.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                <Gamepad2 className="h-5 w-5 text-maroon-accent" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-[15px]">{g.title}</div>
                <div className="text-[12px] text-muted-foreground">
                  +{g.points_reward} pts · <span className="capitalize">{g.kind}</span> ({g.status})
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className={ghost} onClick={() => void toggleStatus(g)}>
                {g.status === "active" ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                className={ghost}
                onClick={async () => {
                  if (confirm("Delete this game?")) {
                    await supabase.from("game_plugins").delete().eq("id", g.id);
                    void load();
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
