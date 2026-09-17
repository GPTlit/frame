import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import ProfileCard from "@/components/ProfileCard";
import { t, useLang } from "@/hooks/use-lang";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyProfile,
  resolveAvatarUrl,
  saveMyProfile,
  uploadAvatar,
  type Profile,
} from "@/lib/profiles";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — FRAME Mauritania" },
      {
        name: "description",
        content:
          "Build your FRAME profile: name, talents, picture, rank and contributions visible to the community.",
      },
      { property: "og:title", content: "Your Profile — FRAME Mauritania" },
      {
        property: "og:description",
        content: "Build your FRAME profile with talents, rank and contributions.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getMyProfile(user.id)
      .then(async (p) => {
        if (!alive) return;
        const next =
          p ??
          ({
            id: user.id,
            username: null,
            full_name: null,
            avatar_url: null,
            talents: [],
            points: 0,
            contributions: 0,
          } satisfies Profile);
        setProfile(next);
        setAvatarPreview(await resolveAvatarUrl(next.avatar_url));
      })
      .catch((e: unknown) => setStatus(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [user]);

  const patch = (next: Partial<Profile>) =>
    setProfile((prev) => (prev ? { ...prev, ...next } : prev));

  const save = async (override?: Partial<Profile>) => {
    if (!user || !profile) return;
    setBusy(true);
    setStatus(null);
    try {
      const body = { ...profile, ...override };
      await saveMyProfile(user.id, {
        username: body.username?.trim().toLowerCase() || null,
        full_name: body.full_name?.trim() || null,
        avatar_url: body.avatar_url,
        talents: body.talents,
      });
      setStatus(t(lang, { en: "Saved", fr: "Enregistré", ar: "تم الحفظ" }));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onPick = async (file: File) => {
    if (!user) return;
    setBusy(true);
    setStatus(null);
    try {
      const path = await uploadAvatar(user.id, file);
      patch({ avatar_url: path });
      setAvatarPreview(await resolveAvatarUrl(path));
      await save({ avatar_url: path });
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const label =
    "mb-1.5 block text-[12px] font-semibold tracking-[0.14em] uppercase text-muted-foreground";
  const field =
    "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 text-[15px] outline-none focus:border-maroon-accent";

  if (!profile) {
    return (
      <main className="grid min-h-[60vh] place-items-center pt-[92px]">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-maroon-accent border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="pt-[92px]">
      <section className="wrap py-14">
        <p className="text-[12px] font-semibold tracking-[0.28em] text-maroon-accent uppercase">
          {t(lang, { en: "Member", fr: "Membre", ar: "عضو" })}
        </p>
        <h1 className="mt-3 font-display text-[clamp(34px,6vw,64px)] leading-[1.02]">
          {t(lang, { en: "Your profile", fr: "Votre profil", ar: "ملفك الشخصي" })}
        </h1>
        <p className="mt-3 max-w-[54ch] text-[15px] text-muted-foreground">
          {t(lang, {
            en: "Add your name, talents and picture. Anyone searching your username sees your rank and contributions.",
            fr: "Ajoutez votre nom, vos talents et votre photo. Toute personne cherchant votre pseudo voit votre rang et vos contributions.",
            ar: "أضف اسمك وموهبتك وصورتك. كل من يبحث عن اسمك يرى رتبتك ومساهماتك.",
          })}
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
          <div className="grid gap-5">
            <div>
              <label className={label} htmlFor="pf-name">
                {t(lang, { en: "Full name", fr: "Nom complet", ar: "الاسم الكامل" })}
              </label>
              <input
                id="pf-name"
                className={field}
                value={profile.full_name ?? ""}
                onChange={(e) => patch({ full_name: e.target.value })}
                onBlur={() => void save()}
                placeholder="Aminetou Salem"
              />
            </div>

            <div>
              <label className={label} htmlFor="pf-handle">
                {t(lang, { en: "Username", fr: "Pseudo", ar: "اسم المستخدم" })}
              </label>
              <input
                id="pf-handle"
                className={field}
                value={profile.username ?? ""}
                onChange={(e) => patch({ username: e.target.value })}
                onBlur={() => void save()}
                placeholder="aminetou"
              />
            </div>

            <div>
              <span className={label}>
                {t(lang, { en: "Profile picture", fr: "Photo de profil", ar: "صورة الملف" })}
              </span>
              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onPick(f);
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md border border-maroon-accent px-4 py-2 text-[14px] font-semibold text-maroon-accent transition-colors hover:bg-maroon-accent/10 disabled:opacity-60"
                >
                  {t(lang, {
                    en: "Upload a picture",
                    fr: "Téléverser une photo",
                    ar: "ارفع صورة",
                  })}
                </button>
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-maroon-accent/60"
                  />
                )}
              </div>
            </div>

            <div>
              <label className={label} htmlFor="pf-tag">
                {t(lang, { en: "Talents", fr: "Talents", ar: "المواهب" })}
              </label>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = tag.trim();
                  if (!v || profile.talents.includes(v)) return;
                  const talents = [...profile.talents, v];
                  patch({ talents });
                  setTag("");
                  void save({ talents });
                }}
              >
                <input
                  id="pf-tag"
                  className={field}
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder={t(lang, {
                    en: "e.g. Photography",
                    fr: "ex. Photographie",
                    ar: "مثال: التصوير",
                  })}
                />
                <button
                  type="submit"
                  className="rounded-md bg-[image:var(--gradient-ember)] px-5 text-[14px] font-semibold text-paper"
                >
                  {t(lang, { en: "Add", fr: "Ajouter", ar: "أضف" })}
                </button>
              </form>
              {profile.talents.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.talents.map((tg) => (
                    <button
                      key={tg}
                      type="button"
                      className="pc-tag"
                      onClick={() => {
                        const talents = profile.talents.filter((x) => x !== tg);
                        patch({ talents });
                        void save({ talents });
                      }}
                      aria-label={`Remove ${tg}`}
                    >
                      {tg} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="rounded-md bg-[image:var(--gradient-ember)] px-6 py-2.5 text-[15px] font-semibold text-paper disabled:opacity-60"
              >
                {t(lang, { en: "Save profile", fr: "Enregistrer", ar: "احفظ الملف" })}
              </button>
              <button
                type="button"
                onClick={() => void supabase.auth.signOut()}
                className="text-[13.5px] font-semibold text-muted-foreground underline-offset-4 hover:text-maroon-accent hover:underline"
              >
                {t(lang, { en: "Sign out", fr: "Se déconnecter", ar: "تسجيل الخروج" })}
              </button>
              {status && <span className="text-[13px] text-muted-foreground">{status}</span>}
            </div>
          </div>

          <ProfileCard
            name={
              profile.full_name?.trim() ||
              t(lang, { en: "Your name", fr: "Votre nom", ar: "اسمك" })
            }
            handle={profile.username?.trim() || "frame"}
            title={profile.talents[0] ?? t(lang, { en: "Talent", fr: "Talent", ar: "موهبة" })}
            tags={profile.talents}
            {...(avatarPreview ? { avatarUrl: avatarPreview } : {})}
            rank={`${profile.points} ${t(lang, { en: "points", fr: "points", ar: "نقطة" })}`}
            contributions={profile.contributions}
          />
        </div>
      </section>
    </main>
  );
}
