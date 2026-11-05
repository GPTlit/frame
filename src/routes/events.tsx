import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import AnimatedList from "@/components/fx/AnimatedList";
import CardSwap from "@/components/fx/CardSwap";
import GradientWaves from "@/components/fx/GradientWaves";
import { t, useLang } from "@/hooks/use-lang";
import { supabase } from "@/integrations/supabase/client";
import { listEvents, listNews, type EventRow, type NewsRow } from "@/lib/admin";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Stats — FRAME Mauritania" },
      { name: "description", content: "Real FRAME events, news and live community numbers across Mauritania." },
      { property: "og:title", content: "Events & Stats — FRAME Mauritania" },
      { property: "og:description", content: "Real FRAME events, news and live community numbers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsPage,
});

function fmtDate(iso: string | null, lang: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : lang, { day: "2-digit", month: "short" });
}

function EventsPage() {
  const { lang } = useLang();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [members, setMembers] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]));
    listNews().then(setNews).catch(() => setNews([]));
    supabase.from("profiles").select("points", { count: "exact" }).then(({ data, count }) => {
      setMembers(count ?? 0);
      setPoints((data ?? []).reduce((s, r) => s + (r.points ?? 0), 0));
    });
  }, []);

  const upcoming = (events ?? []).filter((e) => e.status !== "completed").length;
  const stats = [
    { value: String(members), en: "Registered members", fr: "Membres inscrits", ar: "عضو مسجل" },
    { value: String(events?.length ?? 0), en: "Events", fr: "Événements", ar: "حدث" },
    { value: String(upcoming), en: "Upcoming & live", fr: "À venir et en cours", ar: "قادمة وجارية" },
    { value: String(points), en: "Points awarded", fr: "Points attribués", ar: "نقطة ممنوحة" },
  ];

  const statusLabel = (s: string) =>
    s === "live"
      ? t(lang, { en: "Live", fr: "En cours", ar: "مباشر" })
      : s === "completed"
        ? t(lang, { en: "Completed", fr: "Terminé", ar: "منتهٍ" })
        : t(lang, { en: "Upcoming", fr: "À venir", ar: "قادم" });

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
          <div>
            {events && events.length === 0 && (
              <p className="rounded-lg border border-border p-6 text-muted-foreground">
                {t(lang, { en: "No events published yet.", fr: "Aucun événement publié pour l'instant.", ar: "لا توجد أحداث منشورة بعد." })}
              </p>
            )}
            {events && events.length > 0 && (
              <AnimatedList
                items={events.map((e) => (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="shrink-0 font-display text-[15px] tracking-[0.14em] text-maroon-accent">
                        {fmtDate(e.starts_at, lang)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-display text-[19px]">{e.title}</div>
                        {(e.location || e.description) && (
                          <div className="truncate text-[13px] text-muted-foreground">
                            {[e.location, e.description].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="pc-tag shrink-0">{e.category || statusLabel(e.status)}</span>
                  </div>
                ))}
              />
            )}

            <h2 className="mt-14 font-display text-[28px]">
              {t(lang, { en: "News", fr: "Actualités", ar: "الأخبار" })}
            </h2>
            {news.length === 0 ? (
              <p className="mt-4 text-muted-foreground">
                {t(lang, { en: "No news yet.", fr: "Pas encore d'actualités.", ar: "لا أخبار بعد." })}
              </p>
            ) : (
              <div className="mt-4 grid gap-3">
                {news.map((n) => (
                  <article key={n.id} className="rounded-lg border border-border p-5">
                    <div className="text-[12px] tracking-[0.14em] text-maroon-accent uppercase">
                      {n.kind === "notification" ? t(lang, { en: "Notice", fr: "Avis", ar: "تنبيه" }) : t(lang, { en: "News", fr: "Actu", ar: "خبر" })}
                      {" · "}
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                    <h3 className="mt-1 text-[18px] font-semibold">{n.title}</h3>
                    {n.body && <p className="mt-1 text-[14.5px] whitespace-pre-line text-muted-foreground">{n.body}</p>}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="relative h-[240px]">
              <CardSwap
                className="h-full"
                cards={stats.map((s) => (
                  <div className="flex h-full flex-col justify-end rounded-xl border border-border bg-[image:var(--gradient-ember)] p-7 text-paper shadow-[var(--shadow-lift)]">
                    <span className="font-display text-[58px] leading-none">{s.value}</span>
                    <span className="mt-2 text-[14px] opacity-90">{t(lang, s)}</span>
                  </div>
                ))}
              />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.en} className="rounded-lg border border-border p-4">
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
