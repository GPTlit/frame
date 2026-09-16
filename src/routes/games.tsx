import { createFileRoute } from "@tanstack/react-router";
import AnimatedList from "@/components/fx/AnimatedList";
import GradientWaves from "@/components/fx/GradientWaves";
import { t, useLang } from "@/hooks/use-lang";

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
    ],
  }),
  component: GamesPage,
});

const RANKS = [
  { pos: 1, name: "Aminetou S.", pts: 4820, tag: "Photography" },
  { pos: 2, name: "Sidi M.", pts: 4410, tag: "Football" },
  { pos: 3, name: "Mariem O.", pts: 4180, tag: "Code" },
  { pos: 4, name: "Cheikh A.", pts: 3760, tag: "Poetry" },
  { pos: 5, name: "Fatimetou B.", pts: 3520, tag: "Design" },
];

const MEMBERS = [
  { name: "Yahya D.", handle: "@yahya", rank: "Rising", pts: 1240 },
  { name: "Zeinab K.", handle: "@zeinab", rank: "Contender", pts: 2190 },
  { name: "Moustapha L.", handle: "@mous", rank: "Rising", pts: 980 },
  { name: "Nesrine T.", handle: "@nesrine", rank: "Veteran", pts: 3040 },
];

function GamesPage() {
  const { lang } = useLang();

  return (
    <main className="pt-[92px]">
      <section className="wrap py-14">
        <p className="text-[12px] font-semibold tracking-[0.28em] text-maroon-accent uppercase">
          {t(lang, { en: "Arena", fr: "Arène", ar: "الحلبة" })}
        </p>
        <h1 className="mt-3 font-display text-[clamp(34px,6vw,64px)] leading-[1.02]">
          {t(lang, { en: "Games & ranks", fr: "Jeux et classements", ar: "الألعاب والترتيب" })}
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[24px]">
              {t(lang, { en: "Leaderboard", fr: "Classement", ar: "لوحة الصدارة" })}
            </h2>
            <AnimatedList
              className="mt-4"
              items={RANKS.map((r) => (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="font-display text-[22px] text-maroon-accent">
                      {String(r.pos).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="font-display text-[18px]">{r.name}</div>
                      <div className="text-[12.5px] text-muted-foreground">{r.tag}</div>
                    </div>
                  </div>
                  <span className="font-display text-[17px]">{r.pts}</span>
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
              items={MEMBERS.map((m) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-display text-[18px]">{m.name}</div>
                    <div className="text-[12.5px] text-muted-foreground">{m.handle}</div>
                  </div>
                  <div className="text-right">
                    <span className="pc-tag">{m.rank}</span>
                    <div className="mt-1 text-[12.5px] text-muted-foreground">
                      {m.pts} {t(lang, { en: "points", fr: "points", ar: "نقطة" })}
                    </div>
                  </div>
                </div>
              ))}
            />
          </div>
        </div>
      </section>

      <GradientWaves flip />
    </main>
  );
}
