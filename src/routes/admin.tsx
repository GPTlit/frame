import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { t, useLang } from "@/hooks/use-lang";
import { listEvents, listNews, useIsAdmin, type EventRow, type NewsRow } from "@/lib/admin";
import { listProfiles, displayName, type Profile } from "@/lib/profiles";

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

type Tab = "members" | "events" | "news";
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
            {t(lang, { en: "This area is only for admins.", fr: "Espace réservé aux administrateurs.", ar: "هذه المساحة للمشرفين فقط." })}
          </p>
          <Link to="/profile" className="mt-4 inline-block font-semibold text-maroon-accent">
            {t(lang, { en: "Back to profile", fr: "Retour au profil", ar: "العودة إلى الملف" })}
          </Link>
        </div>
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "members", label: t(lang, { en: "Leaderboard & access", fr: "Classement et accès", ar: "الترتيب والصلاحيات" }) },
    { id: "events", label: t(lang, { en: "Events", fr: "Événements", ar: "الأحداث" }) },
    { id: "news", label: t(lang, { en: "News & notifications", fr: "Actus et notifications", ar: "الأخبار والتنبيهات" }) },
  ];

  return (
    <main className="pt-[92px]">
      <section className="wrap py-14">
        <p className="text-[12px] font-semibold tracking-[0.28em] text-maroon-accent uppercase">Admin</p>
        <h1 className="mt-3 font-display text-[clamp(34px,6vw,58px)] leading-[1.02]">
          {t(lang, { en: "Control room", fr: "Salle de contrôle", ar: "غرفة التحكم" })}
        </h1>
        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((x) => (
            <button key={x.id} type="button" onClick={() => { setTab(x.id); setMsg(null); }}
              className={tab === x.id ? btn : ghost}>{x.label}</button>
          ))}
        </div>
        {msg && <p className="mt-4 text-[13.5px] text-maroon-accent">{msg}</p>}
        <div className="mt-8">
          {tab === "members" && <MembersTab onMsg={setMsg} />}
          {tab === "events" && <EventsTab onMsg={setMsg} />}
          {tab === "news" && <NewsTab onMsg={setMsg} />}
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

  const load = useCallback(async () => {
    setMembers(await listProfiles());
    const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    setAdmins(new Set((data ?? []).map((r) => r.user_id)));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async (m: Profile) => {
    const e = edits[m.id];
    if (!e) return;
    const { error } = await supabase.from("profiles").update(e).eq("id", m.id);
    onMsg(error ? error.message : t(lang, { en: "Saved", fr: "Enregistré", ar: "تم الحفظ" }));
    if (!error) { setEdits((p) => { const n = { ...p }; delete n[m.id]; return n; }); void load(); }
  };

  const toggleAdmin = async (id: string) => {
    const { error } = admins.has(id)
      ? await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin")
      : await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
    onMsg(error ? error.message : t(lang, { en: "Access updated", fr: "Accès mis à jour", ar: "تم تحديث الصلاحية" }));
    void load();
  };

  const s = q.trim().toLowerCase();
  const shown = members.filter((m) => !s || `${m.username ?? ""} ${m.full_name ?? ""}`.toLowerCase().includes(s));

  return (
    <div>
      <input className={`${field} max-w-[360px]`} value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={t(lang, { en: "Search members", fr: "Chercher un membre", ar: "ابحث عن عضو" })} />
      <div className="mt-5 grid gap-3">
        {shown.map((m, i) => {
          const e = edits[m.id] ?? { points: m.points, contributions: m.contributions };
          const set = (k: "points" | "contributions", v: number) =>
            setEdits((p) => ({ ...p, [m.id]: { ...e, [k]: Number.isFinite(v) ? v : 0 } }));
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4">
              <span className="w-8 font-display text-maroon-accent">#{i + 1}</span>
              <div className="min-w-[160px] flex-1">
                <div className="font-semibold">{displayName(m)}</div>
                <div className="text-[13px] text-muted-foreground">@{m.username ?? "—"}{admins.has(m.id) ? " · admin" : ""}</div>
              </div>
              <label className="text-[12px] text-muted-foreground">
                {t(lang, { en: "Points", fr: "Points", ar: "النقاط" })}
                <input type="number" className={`${field} w-24`} value={e.points}
                  onChange={(ev) => set("points", parseInt(ev.target.value, 10))} />
              </label>
              <label className="text-[12px] text-muted-foreground">
                {t(lang, { en: "Contributions", fr: "Contributions", ar: "المساهمات" })}
                <input type="number" className={`${field} w-24`} value={e.contributions}
                  onChange={(ev) => set("contributions", parseInt(ev.target.value, 10))} />
              </label>
              <button type="button" className={ghost} onClick={() => set("points", e.points + 10)}>+10</button>
              <button type="button" className={btn} disabled={!edits[m.id]} onClick={() => void save(m)}>
                {t(lang, { en: "Save", fr: "Enregistrer", ar: "حفظ" })}
              </button>
              <button type="button" className={ghost} onClick={() => void toggleAdmin(m.id)}>
                {admins.has(m.id)
                  ? t(lang, { en: "Remove admin", fr: "Retirer admin", ar: "إزالة الإشراف" })
                  : t(lang, { en: "Make admin", fr: "Donner accès admin", ar: "منح الإشراف" })}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventsTab({ onMsg }: { onMsg: (m: string | null) => void }) {
  const { lang } = useLang();
  const [rows, setRows] = useState<EventRow[]>([]);
  const empty = { title: "", description: "", location: "", category: "", starts_at: "", status: "upcoming" };
  const [form, setForm] = useState(empty);
  const load = useCallback(() => listEvents().then(setRows).catch(() => setRows([])), []);
  useEffect(() => { void load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("events").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      category: form.category.trim() || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      status: form.status,
      created_by: u.user?.id ?? null,
    });
    onMsg(error ? error.message : t(lang, { en: "Event published", fr: "Événement publié", ar: "تم نشر الحدث" }));
    if (!error) { setForm(empty); void load(); }
  };

  const setStatus = async (id: string, status: string) => {
    await supabase.from("events").update({ status }).eq("id", id);
    void load();
  };
  const remove = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    void load();
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
      <form onSubmit={create} className="grid gap-3">
        <input className={field} required placeholder={t(lang, { en: "Event title", fr: "Titre", ar: "عنوان الحدث" })}
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className={field} placeholder={t(lang, { en: "Location", fr: "Lieu", ar: "المكان" })}
          value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input className={field} placeholder={t(lang, { en: "Category (e.g. Chess)", fr: "Catégorie", ar: "الفئة" })}
          value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input className={field} type="datetime-local" value={form.starts_at}
          onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
        <select className={field} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
        </select>
        <textarea className={field} rows={3} placeholder={t(lang, { en: "Description", fr: "Description", ar: "الوصف" })}
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button type="submit" className={btn}>{t(lang, { en: "Publish event", fr: "Publier", ar: "انشر الحدث" })}</button>
      </form>
      <div className="grid content-start gap-3">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4">
            <div className="min-w-[180px] flex-1">
              <div className="font-semibold">{r.title}</div>
              <div className="text-[13px] text-muted-foreground">
                {[r.starts_at && new Date(r.starts_at).toLocaleString(), r.location, r.category].filter(Boolean).join(" · ")}
              </div>
            </div>
            <select className={`${field} w-36`} value={r.status} onChange={(e) => void setStatus(r.id, e.target.value)}>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
            <button type="button" className={ghost} onClick={() => void remove(r.id)}>
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
  const load = useCallback(() => listNews().then(setRows).catch(() => setRows([])), []);
  useEffect(() => { void load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("news").insert({
      title: form.title.trim(), body: form.body.trim() || null, kind: form.kind, created_by: u.user?.id ?? null,
    });
    onMsg(error ? error.message : t(lang, { en: "Published", fr: "Publié", ar: "تم النشر" }));
    if (!error) { setForm({ title: "", body: "", kind: "news" }); void load(); }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
      <form onSubmit={create} className="grid gap-3">
        <select className={field} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
          <option value="news">{t(lang, { en: "News", fr: "Actualité", ar: "خبر" })}</option>
          <option value="notification">{t(lang, { en: "Notification", fr: "Notification", ar: "تنبيه" })}</option>
        </select>
        <input className={field} required placeholder={t(lang, { en: "Title", fr: "Titre", ar: "العنوان" })}
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className={field} rows={5} placeholder={t(lang, { en: "Message", fr: "Message", ar: "الرسالة" })}
          value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <button type="submit" className={btn}>{t(lang, { en: "Publish", fr: "Publier", ar: "انشر" })}</button>
      </form>
      <div className="grid content-start gap-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-start gap-3 rounded-lg border border-border p-4">
            <div className="flex-1">
              <div className="text-[12px] tracking-[0.14em] text-maroon-accent uppercase">{r.kind}</div>
              <div className="font-semibold">{r.title}</div>
              {r.body && <p className="text-[14px] text-muted-foreground">{r.body}</p>}
            </div>
            <button type="button" className={ghost}
              onClick={async () => { await supabase.from("news").delete().eq("id", r.id); void load(); }}>
              {t(lang, { en: "Delete", fr: "Supprimer", ar: "حذف" })}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
