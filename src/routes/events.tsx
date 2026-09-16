import { createFileRoute } from "@tanstack/react-router";
import AnimatedList from "@/components/fx/AnimatedList";
import CardSwap from "@/components/fx/CardSwap";
import GradientWaves from "@/components/fx/GradientWaves";
import { t, useLang } from "@/hooks/use-lang";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Stats — FRAME Mauritania" },
      {
        name: "description",
        content:
          "Upcoming FRAME gatherings, tournaments and creative labs across Mauritania, with live participation stats.",
      },
      { property: "og:title", content: "Events & Stats — FRAME Mauritania" },
      {
        property: "og:description",
        content: "Upcoming FRAME gatherings, tournaments and creative labs across Mauritania.",
      },
    ],
  }),
  component: EventsPage,
});

const EVENTS = [
  { date: "12 OCT", en: "Coast Sessions — Nouakchott", fr: "Sessions Côte — Nouakchott", ar: "جلسات الساحل — نواكشوط", kind: "Open mic" },
  { date: "26 OCT", en: "Desert Code Sprint", fr: "Sprint Code du Désert", ar: "ماراثون البرمجة الصحراوي", kind: "Hackathon" },
  { date: "09 NOV", en: "Frame Football Cup", fr: "Coupe de Football Frame", ar: "كأس فريم لكرة القدم", kind: "Tournament" },
  { date: "23 NOV", en: "Studio Night — Design", fr: "Nuit Studio — Design", ar: "ليلة الاستوديو — تصميم", kind: "Workshop" },
  { date: "07 DEC", en: "Voices of Adrar", fr: "Voix de l'Adrar", ar: "أصوات آدرار", kind: "Showcase" },
];

const STATS = [
  { value: "12k+", en: "Young members", fr: "Jeunes membres", ar: "عضو شاب" },
  { value: "64", en: "Events hosted", fr: "Événements", ar: "حدثًا" },
  { value: "9", en: "Regions", fr: "Régions", ar: "ولايات" },
  { value: "180", en: "Partners", fr: "Partenaires", ar: "شريكًا" },
];

function EventsPage() {
  const { lang } = useLang();

  return (
    <main className="pt-[92px]">
      <section className="wrap py-14">
        <p className="text-[12px] font-semibold tracking-[0.28em] text-maroon-accent uppercase">
          {t(lang, { en: "Calendar", fr: "Calendrier", ar: "الأجندة" })}
        </p>
        <h1 className="mt-3 font-display text-[clamp(34px,6vw,64px)] leading-[1.02]">
          {t(lang, { en: "Events & stats", fr: "Événements et chiffres", ar: "الأحداث والأرقام" })}
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <AnimatedList
            items={EVENTS.map((e) => (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="font-display text-[15px] tracking-[0.14em] text-maroon-accent">
                    {e.date}
                  </span>
                  <span className="font-display text-[19px]">{t(lang, e)}</span>
                </div>
                <span className="pc-tag">{e.kind}</span>
              </div>
            ))}
          />

          <div>
            <div className="relative h-[240px]">
              <CardSwap
                className="h-full"
                cards={STATS.map((s) => (
                  <div className="flex h-full flex-col justify-end rounded-xl border border-border bg-[image:var(--gradient-ember)] p-7 text-paper shadow-[var(--shadow-lift)]">
                    <span className="font-display text-[58px] leading-none">{s.value}</span>
                    <span className="mt-2 text-[14px] opacity-90">{t(lang, s)}</span>
                  </div>
                ))}
              />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div key={s.value} className="rounded-lg border border-border p-4">
                  <div className="font-display text-[26px]">{s.value}</div>
                  <div className="text-[13px] text-muted-foreground">{t(lang, s)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <GradientWaves />
    </main>
  );
}
