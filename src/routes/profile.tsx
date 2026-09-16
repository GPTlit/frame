import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import ProfileCard from "@/components/ProfileCard";
import { t, useLang } from "@/hooks/use-lang";

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

const KEY = "frame-profile";

type Profile = {
  name: string;
  handle: string;
  avatarUrl: string;
  tags: string[];
};

const EMPTY: Profile = { name: "", handle: "", avatarUrl: "", tags: [] };

function ProfilePage() {
  const { lang } = useLang();
  const [p, setP] = useState<Profile>(EMPTY);
  const [tag, setTag] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        setP({ ...EMPTY, ...(JSON.parse(raw) as Partial<Profile>) });
      } catch {
        /* ignore malformed storage */
      }
    }
  }, []);

  const save = (next: Profile) => {
    setP(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const label = "mb-1.5 block text-[12px] font-semibold tracking-[0.14em] uppercase text-muted-foreground";
  const field =
    "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 text-[15px] outline-none focus:border-maroon-accent";

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
                value={p.name}
                onChange={(e) => save({ ...p, name: e.target.value })}
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
                value={p.handle}
                onChange={(e) => save({ ...p, handle: e.target.value })}
                placeholder="aminetou"
              />
            </div>

            <div>
              <label className={label} htmlFor="pf-avatar">
                {t(lang, { en: "Picture link", fr: "Lien de la photo", ar: "رابط الصورة" })}
              </label>
              <input
                id="pf-avatar"
                className={field}
                value={p.avatarUrl}
                onChange={(e) => save({ ...p, avatarUrl: e.target.value })}
                placeholder="https://…"
              />
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
                  if (!v || p.tags.includes(v)) return;
                  save({ ...p, tags: [...p.tags, v] });
                  setTag("");
                }}
              >
                <input
                  id="pf-tag"
                  className={field}
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder={t(lang, { en: "e.g. Photography", fr: "ex. Photographie", ar: "مثال: التصوير" })}
                />
                <button
                  type="submit"
                  className="rounded-md bg-[image:var(--gradient-ember)] px-5 text-[14px] font-semibold text-paper"
                >
                  {t(lang, { en: "Add", fr: "Ajouter", ar: "أضف" })}
                </button>
              </form>
              {p.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tags.map((tg) => (
                    <button
                      key={tg}
                      type="button"
                      className="pc-tag"
                      onClick={() => save({ ...p, tags: p.tags.filter((x) => x !== tg) })}
                      aria-label={`Remove ${tg}`}
                    >
                      {tg} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[13px] text-muted-foreground">
              {t(lang, {
                en: "Signing in with Google and saving profiles for everyone needs the built-in backend switched on.",
                fr: "La connexion Google et l'enregistrement des profils nécessitent l'activation du backend intégré.",
                ar: "تسجيل الدخول عبر جوجل وحفظ الملفات يحتاج تشغيل الخدمة الخلفية.",
              })}
            </p>
          </div>

          <ProfileCard
            name={p.name || t(lang, { en: "Your name", fr: "Votre nom", ar: "اسمك" })}
            handle={p.handle || "frame"}
            title={p.tags[0] ?? t(lang, { en: "Talent", fr: "Talent", ar: "موهبة" })}
            tags={p.tags}
            {...(p.avatarUrl ? { avatarUrl: p.avatarUrl } : {})}
            rank="Rising #128"
            contributions={12}
          />
        </div>
      </section>
    </main>
  );
}
