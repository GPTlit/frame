import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import AnimatedList from "@/components/fx/AnimatedList";
import GradientWaves from "@/components/fx/GradientWaves";
import ParticleText from "@/components/ParticleText";
import { listProfiles, displayName, type Profile } from "@/lib/profiles";
import { t, useLang } from "@/hooks/use-lang";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Games & Ranks — FRAME Mauritania" },
      {
        name: "description",
        content:
          "FRAME leaderboards and member rankings: see who is climbing and how contributions add up.",
      },
      { property: "og:title", content: "Games & Ranks — FRAME Mauritania" },
      {
        property: "og:description",
        content: "FRAME leaderboards and member rankings across challenges.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamesPage,
});

function rankTitle(points: number) {
  if (points >= 3000) return { en: "Veteran", fr: "Vétéran", ar: "مخضرم" };
  if (points >= 1500) return { en: "Contender", fr: "Prétendant", ar: "منافس" };
  return { en: "Rising", fr: "Montant", ar: "صاعد" };
}

function GamesPage() {
  const { lang } = useLang();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listProfiles()
      .then((rows) => {
        if (alive) setProfiles(rows);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const top = profiles.slice(0, 10);
  const rest = profiles.slice(10);

  return (
    <main className="pt-[92px]">
      <section className="wrap pt-6">
        <p className="text-[12px] font-semibold tracking-[0.28em] text-maroon-accent uppercase">
          {t(lang, { en: "Arena", fr: "Arène", ar: "الحلبة" })}
        </p>
        <ParticleText
          text={t(lang, { en: "GAMES", fr: "JEUX", ar: "الألعاب" })}
          particleSize={2.2}
          density={4}
          color={theme === "dark" ? "#f8fafc" : "#7A0B18"}
          highlightColor="#8b5cf6"
          scatter={280}
          gatherDuration={1600}
          stagger={420}
          pointerRepel={42}
          repelRadius={120}
          idleDrift={0.8}
          trigger="hover"
          fontSize="clamp(3.5rem, 13vw, 9rem)"
          fontWeight={500}
          fontFamily="inherit"
          glow
          className="mt-2"
          style={{ height: "clamp(180px, 26vw, 300px)" }}
        />
      </section>

      <section className="wrap pb-14">
        {loading && (
          <p className="text-[14px] text-muted-foreground">
            {t(lang, { en: "Loading members…", fr: "Chargement des membres…", ar: "جارٍ تحميل الأعضاء…" })}
          </p>
        )}
        {error && <p className="text-[14px] text-maroon-accent">{error}</p>}

        {!loading && !error && profiles.length === 0 && (
          <p className="text-[15px] text-muted-foreground">
            {t(lang, {
              en: "No members yet. Complete your profile to appear on the leaderboard.",
              fr: "Aucun membre pour l’instant. Complétez votre profil pour apparaître au classement.",
              ar: "لا يوجد أعضاء بعد. أكمل ملفك لتظهر في لوحة الصدارة.",
            })}
          </p>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-[24px]">
                {t(lang, { en: "Leaderboard", fr: "Classement", ar: "لوحة الصدارة" })}
              </h2>
              <AnimatedList
                className="mt-4"
                items={top.map((p, i) => (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="font-display text-[22px] text-maroon-accent">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="font-display text-[18px]">{displayName(p)}</div>
                        <div className="text-[12.5px] text-muted-foreground">
                          {p.talents?.[0] ?? (p.username ? `@${p.username}` : "—")}
                        </div>
                      </div>
                    </div>
                    <span className="font-display text-[17px]">{p.points}</span>
                  </div>
                ))}
              />
            </div>

            <div>
              <h2 className="font-display text-[24px]">
                {t(lang, { en: "Members", fr: "Membres", ar: "الأعضاء" })}
              </h2>
              <AnimatedList
                className="mt-4"
                items={(rest.length > 0 ? rest : profiles).map((p) => (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-display text-[18px]">{displayName(p)}</div>
                      <div className="text-[12.5px] text-muted-foreground">
                        {p.username ? `@${p.username}` : "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="pc-tag">{t(lang, rankTitle(p.points))}</span>
                      <div className="mt-1 text-[12.5px] text-muted-foreground">
                        {p.contributions}{" "}
                        {t(lang, {
                          en: "contributions",
                          fr: "contributions",
                          ar: "مساهمة",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              />
            </div>
          </div>
        )}
      </section>

      <GradientWaves flip />
    </main>
  );
}
