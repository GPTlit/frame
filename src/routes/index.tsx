import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Reveal, useInView } from "@/components/frame/Reveal";
import { FrameMark, SiteChrome } from "@/components/frame/SiteChrome";
import { WaterScene, WaveDivider, Bubbles } from "@/components/frame/WaterScene";
import { DuneScene, SandParticles, Palm } from "@/components/frame/NatureScene";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "FRAME — Mauritanian talent, challenge & meaningful experiences",
      },
      {
        name: "description",
        content:
          "FRAME is a Mauritanian youth platform uniting academic challenges, strategy games, sport, culture and community impact through premium competitive experiences.",
      },
      {
        property: "og:title",
        content: "FRAME — Mauritanian talent, challenge & meaningful experiences",
      },
      {
        property: "og:description",
        content:
          "One identity, many arenas: competitions and experiences that discover talent and turn ambition into impact across Mauritania.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* ------------------------------ small pieces ------------------------------ */

function Eyebrow({
  en,
  fr,
  ar,
  tone = "light",
}: {
  en: string;
  fr: string;
  ar: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className="eyebrow">
      <span>{en}</span>
      <span className={tone === "dark" ? "text-[oklch(1_0_0/0.25)]" : "text-border"}>/</span>
      <span
        className={tone === "dark" ? "font-medium text-maroon-soft" : "font-medium text-muted-foreground"}
      >
        {fr}
      </span>
      <span className={tone === "dark" ? "text-[oklch(1_0_0/0.25)]" : "text-border"}>/</span>
      <span
        dir="rtl"
        className={tone === "dark" ? "font-medium text-maroon-soft" : "font-medium text-muted-foreground"}
      >
        {ar}
      </span>
    </div>
  );
}

function SectionHead({
  en,
  fr,
  ar,
  title,
  lede,
}: {
  en: string;
  fr: string;
  ar: string;
  title: string;
  lede: string;
}) {
  return (
    <Reveal className="mb-14 max-w-[760px]">
      <Eyebrow en={en} fr={fr} ar={ar} />
      <h2 className="text-[clamp(28px,4vw,42px)] font-normal">{title}</h2>
      <p className="mt-[18px] max-w-[56ch] text-[17px] text-muted-foreground">{lede}</p>
    </Reveal>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [n, setN] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / 1400, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [inView, to]);

  return (
    <span ref={ref} className="font-display text-[clamp(34px,5vw,54px)] leading-none">
      {n}
      {suffix}
    </span>
  );
}

/* --------------------------------- data ---------------------------------- */

const ARENAS = [
  {
    num: "01",
    title: "Academic & Intelligence",
    text: "Mathematics, puzzles, logic, programming, quizzes and scientific challenges.",
  },
  {
    num: "02",
    title: "Games & Strategy",
    text: "Chess, mind games, strategy games and decision-based challenges.",
  },
  {
    num: "03",
    title: "Sports",
    text: "Organized, safety-conscious competition for athletes, teams and clubs.",
  },
  {
    num: "04",
    title: "Culture & Knowledge",
    text: "Heritage, language, religious competitions and knowledge-driven formats.",
  },
  {
    num: "05",
    title: "Community & Charity",
    text: "Initiatives that turn each event into concrete, positive local impact.",
  },
  {
    num: "06",
    title: "Coast & Environment",
    text: "Beach clean-ups, oasis and water awareness across Mauritania's shoreline and dunes.",
  },
];

const VMPA = [
  {
    letter: "V",
    title: "Vision",
    en: "To become a leading Mauritanian platform for discovering talent, producing high-quality events and eventually creating pathways to international representation.",
    fr: "Devenir une plateforme mauritanienne de référence pour révéler les talents, créer des événements de qualité et ouvrir, à terme, des voies vers la représentation internationale.",
  },
  {
    letter: "M",
    title: "Mission",
    en: "Design engaging competitions and experiences where young people can challenge themselves, learn, showcase ability and create positive impact.",
    fr: "Concevoir des compétitions et expériences engageantes où les jeunes peuvent se challenger, apprendre, révéler leurs capacités et créer un impact positif.",
  },
  {
    letter: "P",
    title: "Positioning",
    en: "A youthful, premium, intelligent and competitive identity. Neither a traditional academic club nor entertainment only: a multidisciplinary platform built around experience and challenge.",
    fr: "Une identité jeune, premium, intelligente et compétitive — ni club académique classique, ni simple structure de divertissement.",
  },
  {
    letter: "A",
    title: "Ambition",
    en: "Develop top participants from competitors into supported talent, and later into teams capable of representing Mauritania internationally.",
    fr: "Faire évoluer les meilleurs participants vers des talents accompagnés, puis vers des équipes capables de porter le nom de la Mauritanie à l'international.",
  },
];

const ABCD = [
  { letter: "A — Attraction", text: "A clear concept, strong event name and identity that attracts." },
  { letter: "B — Competition", text: "Published rules, clear stages, disciplined judging and fairness." },
  {
    letter: "C — Experience",
    text: "Qualifiers, pacing, surprise moments, strong finals and engaging coverage.",
  },
  {
    letter: "D — Legacy",
    text: "A lasting result: discovered talent, stronger community, partnership or social impact.",
  },
];

const VALUES = [
  ["01", "Excellence", "Execution quality is part of the organization's reputation."],
  ["02", "Fairness", "Clear rules, impartial judging and transparent results."],
  ["03", "Intelligence", "Design formats that genuinely reward thinking and skill."],
  ["04", "Inclusion", "Create space for different talents while respecting each activity's nature."],
  ["05", "Impact", "Each activity should add value to participants, community or Mauritania's image."],
  ["06", "Identity", "Every event should feel unmistakably FRAME even before the name is seen."],
];

const MARQUEE = [
  "Academic & Intelligence",
  "Games & Strategy",
  "Sports",
  "Culture & Knowledge",
  "Community & Charity",
];

/* -------------------------------- sections -------------------------------- */

function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setTilt({
        x: (e.clientX - r.left) / r.width - 0.5,
        y: (e.clientY - r.top) / r.height - 0.5,
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      ref={heroRef}
      id="top"
      className="relative flex min-h-[94vh] flex-col justify-center overflow-hidden pt-[168px]"
    >
      <span
        className="pointer-events-none absolute -top-[120px] -right-20 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,var(--maroon-accent),transparent_70%)] opacity-35 blur-[60px]"
        style={{ animation: "drift-a 16s ease-in-out infinite" }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-[100px] left-[10%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,var(--water),transparent_70%)] opacity-30 blur-[60px]"
        style={{ animation: "drift-b 20s ease-in-out infinite" }}
        aria-hidden
      />
      <SandParticles count={18} />
      <Palm className="pointer-events-none absolute -bottom-6 right-[4%] hidden h-56 opacity-30 md:block" delay={1} />

      <div className="wrap relative z-2">
        <div
          className="mb-9 w-16 will-change-transform"
          style={{
            transform: `translate(${tilt.x * 14}px, ${tilt.y * 10}px) rotate(${tilt.x * 4}deg)`,
          }}
        >
          <FrameMark className="mark-draw h-[76px] w-16 text-maroon-700" />
        </div>

        <h1
          className="max-w-[15em] text-[clamp(38px,6.2vw,76px)] leading-[1.05] font-normal"
          style={{ transform: `translate(${tilt.x * -6}px, ${tilt.y * -4}px)` }}
        >
          <span className="line-mask">
            <span style={{ animationDelay: "0.25s" }}>
              A frame for <em className="not-italic text-maroon-accent">talent</em>,
            </span>
          </span>
          <span className="line-mask">
            <span style={{ animationDelay: "0.4s" }}>
              <em className="not-italic text-maroon-accent">challenge</em> and meaningful
            </span>
          </span>
          <span className="line-mask">
            <span style={{ animationDelay: "0.55s" }}>experiences.</span>
          </span>
        </h1>

        <div
          className="mt-14 grid max-w-[920px] gap-[34px] border-t border-border pt-[30px] opacity-0 md:grid-cols-3"
          style={{ animation: "fade-up 0.8s ease forwards 1s" }}
        >
          <div>
            <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-accent">
              العربية
            </span>
            <p dir="rtl" className="text-[16px]">
              إطار موريتاني يجمع الترفيه والتنافس والمعرفة والرياضة والعمل المجتمعي.
            </p>
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-accent">
              Français
            </span>
            <p className="text-[15px] text-muted-foreground">
              Un cadre mauritanien qui réunit divertissement, compétition, savoir, sport et impact
              social.
            </p>
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-accent">
              English
            </span>
            <p className="text-[15px] text-muted-foreground">
              A Mauritanian platform bringing together entertainment, competition, knowledge, sport
              and social impact.
            </p>
          </div>
        </div>

        <div className="relative z-2 mx-auto mt-14 mb-10 h-[46px] w-px overflow-hidden bg-border">
          <span
            className="absolute -top-[46px] left-0 h-[46px] w-px bg-maroon-accent"
            style={{ animation: "cue-drop 2.2s ease-in-out infinite" }}
          />
        </div>
      </div>

      <WaveDivider className="absolute inset-x-0 bottom-0 z-1" />
    </section>
  );
}

function Marquee() {
  return (
    <div className="marquee-wrap overflow-hidden border-y border-border bg-paper py-[22px]">
      <div className="marquee-track">
        {[...MARQUEE, ...MARQUEE].map((m, i) => (
          <span
            key={i}
            className="flex items-center gap-[18px] font-display text-[20px] whitespace-nowrap text-muted-foreground"
          >
            <strong className="font-medium text-foreground">{m}</strong>
            <span className="text-maroon-accent">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Identity() {
  return (
    <section id="identity" className="border-t border-border py-26">
      <div className="wrap">
        <SectionHead
          en="Identity"
          fr="Identité"
          ar="الهوية"
          title="What is FRAME?"
          lede="FRAME is a Mauritanian youth organization that builds competitive and entertaining experiences — discovering talent, developing ability, and creating an active community around knowledge and skill."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Reveal delay={0} className="frame-card" >
            <span className="mb-3.5 block text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-accent">
              العربية
            </span>
            <div dir="rtl">
              <h3 className="mb-3.5 text-[20px]">جوهر الفكرة</h3>
              <p className="text-[15.5px] leading-[1.9]">
                FRAME ليست محصورة في مجال واحد. هي إطار يجمع مسابقات الذكاء والأكاديميا، الألعاب
                الاستراتيجية، الرياضة، الثقافة، المبادرات الدينية، والعمل الخيري ضمن تجارب منظمة
                وجذابة.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120} className="frame-card">
            <span className="mb-3.5 block text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-accent">
              Français
            </span>
            <h3 className="mb-3.5 text-[20px]">Essence</h3>
            <p className="text-[14.5px] text-muted-foreground">
              FRAME n'est pas limitée à un seul domaine. Elle rassemble compétitions académiques,
              jeux de réflexion, sport, culture, activités religieuses et actions caritatives dans
              des expériences structurées et attractives.
            </p>
          </Reveal>
          <Reveal delay={240} className="frame-card">
            <span className="mb-3.5 block text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-accent">
              English
            </span>
            <h3 className="mb-3.5 text-[20px]">Essence</h3>
            <p className="text-[14.5px] text-muted-foreground">
              FRAME combines academic challenges, mind games, sport, culture, religious competitions
              and charitable action through structured, engaging experiences. Challenge is the
              method; talent and impact are the outcome.
            </p>
          </Reveal>
        </div>

        <Reveal className="relative mt-6 overflow-hidden rounded-sm bg-maroon-700 px-8 py-9 text-maroon-soft">
          <span
            className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,oklch(1_0_0/0.12),transparent_55%)]"
            style={{ animation: "sheen 7s ease-in-out infinite" }}
            aria-hidden
          />
          <Bubbles count={8} />
          <div className="relative z-1 grid gap-7 md:grid-cols-3">
            <div dir="rtl">
              <span className="mb-2.5 block text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-soft">
                الموقع
              </span>
              <h4 className="mb-2 text-[20px] text-paper">موريتانيا</h4>
              <p className="text-[14.5px]">مع قابلية للتوسع والتعاون إقليميًا ودوليًا.</p>
            </div>
            <div>
              <span className="mb-2.5 block text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-soft">
                Position
              </span>
              <h4 className="mb-2 text-[20px] text-paper">Mauritanie</h4>
              <p className="text-[14.5px]">
                Avec une ambition de coopération régionale et internationale.
              </p>
            </div>
            <div>
              <span className="mb-2.5 block text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-soft">
                Position
              </span>
              <h4 className="mb-2 text-[20px] text-paper">Mauritania</h4>
              <p className="text-[14.5px]">
                With potential for regional and international collaboration.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Direction() {
  return (
    <section id="direction" className="border-t border-border py-26">
      <div className="wrap">
        <SectionHead
          en="Direction"
          fr="Orientation"
          ar="الاتجاه"
          title="Vision, mission & positioning"
          lede="Four statements that define where FRAME is going, why it exists, what it is not, and what success looks like for the people who take part."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {VMPA.map((v, i) => (
            <Reveal
              key={v.letter}
              delay={i * 110}
              className="frame-card group border-l-[3px] border-l-maroon-700"
            >
              <span className="absolute top-4 right-6 font-display text-[38px] text-border transition-all duration-500 group-hover:scale-125 group-hover:-rotate-6 group-hover:text-[oklch(0.478_0.145_20.6/0.28)]">
                {v.letter}
              </span>
              <h3 className="mb-4 text-[20px]">{v.title}</h3>
              <div className="grid gap-3.5">
                <div>
                  <span className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-maroon-accent">
                    English
                  </span>
                  <p className="text-[14.5px] text-muted-foreground">{v.en}</p>
                </div>
                <div>
                  <span className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-maroon-accent">
                    Français
                  </span>
                  <p className="text-[14.5px] text-muted-foreground">{v.fr}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WaterSection() {
  return (
    <section id="water" className="relative border-t border-border">
      <WaveDivider flip />
      <WaterScene>
        <div className="wrap py-24 text-paper">
          <Reveal className="max-w-[760px]">
            <div className="eyebrow !text-water-light">
              <span>Coast</span>
              <span className="text-[oklch(1_0_0/0.3)]">/</span>
              <span>Littoral</span>
              <span className="text-[oklch(1_0_0/0.3)]">/</span>
              <span dir="rtl">الساحل</span>
            </div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-normal text-paper">
              700 km of Atlantic coastline — where challenge meets tide.
            </h2>
            <p className="mt-5 max-w-[56ch] text-[16.5px] text-[oklch(1_0_0/0.82)]">
              From Nouadhibou to Nouakchott, water shapes Mauritanian life. FRAME's coastal arena
              brings competition to the shoreline: swimming, rowing, beach sport and environmental
              action that leaves the sand cleaner than we found it.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { n: 754, s: " km", l: "Atlantic shoreline", d: "From Cap Blanc down to the Senegal river mouth." },
              { n: 5, s: "", l: "Coastal arenas", d: "Swim, row, beach sport, clean-up, marine knowledge." },
              { n: 12, s: " mo", l: "Season", d: "Trade winds make the coast competitive all year." },
            ].map((c, i) => (
              <Reveal
                key={c.l}
                delay={i * 130}
                className="rounded-sm border border-[oklch(1_0_0/0.25)] bg-[oklch(1_0_0/0.08)] p-7 backdrop-blur-sm"
              >
                <Counter to={c.n} suffix={c.s} />
                <h3 className="mt-3 text-[18px] text-paper">{c.l}</h3>
                <p className="mt-1.5 text-[14px] text-[oklch(1_0_0/0.75)]">{c.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </WaterScene>
      <WaveDivider />
    </section>
  );
}

function Journey() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const steps = [
    ["01", "Competitor", "Young people take part in a FRAME event across academics, games, sport, culture or community action."],
    ["02", "Supported talent", "Standout participants are identified and accompanied as their ability develops."],
    ["03", "National representation", "The strongest talents form teams capable of carrying Mauritania's name into regional and international competition."],
  ];
  return (
    <section id="journey" className="border-t border-border py-26">
      <div className="wrap">
        <SectionHead
          en="Pathway"
          fr="Parcours"
          ar="المسار"
          title="From participant to national talent"
          lede="The ambition behind every FRAME event is the same three-step arc, whichever arena it happens in."
        />
        <div
          ref={ref}
          className="relative mt-3 flex flex-wrap items-stretch rounded-sm border border-border bg-paper"
        >
          {steps.map(([k, t, d], i) => (
            <div key={k} className="flex min-w-[200px] flex-1 items-stretch">
              <div className={`flex-1 px-6 py-7 ${i ? "md:border-l md:border-border" : ""}`}>
                <span className="mb-2.5 inline-block font-display text-[15px] text-maroon-accent">
                  {k}
                </span>
                <h4 className="mb-2 text-[19px]">{t}</h4>
                <p className="text-[14px] text-muted-foreground">{d}</p>
              </div>
              {i < 2 && (
                <div className="hidden w-9 items-center justify-center text-[18px] text-maroon-accent md:flex">
                  <span style={{ animation: "nudge 1.6s ease-in-out infinite" }}>→</span>
                </div>
              )}
            </div>
          ))}
          <span
            className="absolute -bottom-px left-0 h-0.5 bg-maroon-accent transition-[width] duration-[1400ms] ease-out"
            style={{ width: inView ? "100%" : "0%" }}
          />
        </div>
      </div>
    </section>
  );
}

function Arenas() {
  return (
    <section id="arenas" className="border-t border-border py-26">
      <div className="wrap">
        <SectionHead
          en="Activity pillars"
          fr="Pôles"
          ar="مجالات النشاط"
          title="Six arenas. One FRAME."
          lede="Different fields, the same standard of design, fairness and challenge."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARENAS.map((a, i) => (
            <Reveal
              key={a.num}
              delay={i * 90}
              className="frame-card group overflow-hidden border-t-[3px] border-t-maroon-700"
            >
              <span
                className="absolute inset-y-0 -left-full w-full bg-[linear-gradient(90deg,transparent,oklch(0.478_0.145_20.6/0.08),transparent)] transition-[left] duration-700 group-hover:left-full"
                aria-hidden
              />
              <span className="mb-4 block font-display text-[14px] tracking-[0.05em] text-maroon-accent">
                {a.num}
              </span>
              <h3 className="mb-3.5 text-[20px]">{a.title}</h3>
              <p className="text-[14.5px] text-muted-foreground">{a.text}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-9 flex flex-wrap gap-2.5">
          {["Competition", "Experience", "Talent", "Community", "Impact"].map((p) => (
            <span key={p} className="pill">
              {p}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function NatureSection() {
  return (
    <section id="nature" className="relative border-t border-border">
      <DuneScene />
      <div className="wrap py-24">
        <SectionHead
          en="Land"
          fr="Territoire"
          ar="الأرض"
          title="Dunes, oases and the long horizon"
          lede="Mauritania is desert, oasis and ocean at once. FRAME's identity borrows its patience from the dunes and its energy from the tide — and gives back through environmental initiatives in every season."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Oasis", "Date palms, shade and water — the original meeting place for knowledge and trade."],
            ["Dune", "Shifting sand teaches adaptation: our formats evolve with the people in them."],
            ["Horizon", "Ambition beyond borders — regional and international collaboration."],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={i * 120} className="frame-card">
              <Palm className="mb-4 h-16 opacity-80" delay={i * 0.6} />
              <h3 className="mb-3 text-[20px]">{t}</h3>
              <p className="text-[14.5px] text-muted-foreground">{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventDna() {
  return (
    <section id="experience" className="border-t border-border py-26">
      <div className="wrap">
        <SectionHead
          en="Event DNA"
          fr="ADN des événements"
          ar="هوية الفعاليات"
          title="Not just a competition. An experience."
          lede="Every FRAME event should go beyond a traditional contest — combining clarity, competition, pace, fairness, visual identity and an engaging experience for participants and spectators alike."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {ABCD.map((a, i) => (
            <Reveal
              key={a.letter}
              delay={i * 110}
              className="frame-card border-l-[3px] border-l-maroon-700"
            >
              <span className="mb-3 block font-display text-[15px] text-maroon-accent">
                {a.letter}
              </span>
              <p className="text-[14.5px] text-muted-foreground">{a.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Values() {
  return (
    <section id="values" className="border-t border-border py-26">
      <div className="wrap">
        <SectionHead
          en="Values"
          fr="Valeurs"
          ar="القيم"
          title="How FRAME operates"
          lede="Six standards that every event and initiative is measured against, regardless of which arena it sits in."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(([idx, t, d], i) => (
            <Reveal
              key={idx}
              delay={i * 80}
              className="border-t border-border py-6 transition-transform duration-400 hover:translate-x-1.5"
            >
              <span className="mb-2.5 block text-[12px] font-semibold tracking-[0.08em] text-maroon-accent">
                {idx}
              </span>
              <h3 className="mb-3 text-[20px]">{t}</h3>
              <p className="text-[14.5px] text-muted-foreground">{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Audience() {
  return (
    <section id="audience" className="border-t border-border py-26">
      <div className="wrap grid items-start gap-14 md:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <Eyebrow en="Audience" fr="Public" ar="الجمهور" />
          <h2 className="text-[clamp(28px,4vw,42px)] font-normal">Who FRAME is built for</h2>
          <p className="mt-3.5 text-[17px] text-muted-foreground">
            A youthful, premium and competitive identity — built for young Mauritanians who want more
            than one lane to prove themselves in.
          </p>
          <ul className="mt-6 grid gap-4">
            {[
              "Young people looking to compete, learn and be seen across more than one field",
              "Students and problem-solvers drawn to academic, logic and strategy challenges",
              "Athletes and teams looking for organized, safety-conscious competition",
              "Community members who want FRAME's presence to translate into real, positive impact",
            ].map((li) => (
              <li key={li} className="group relative pl-6 text-[15px]">
                <span className="absolute left-0 text-maroon-accent transition-transform duration-300 group-hover:translate-x-1">
                  —
                </span>
                {li}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={150} className="frame-card">
          <h3 className="mb-3.5 text-[20px]">Not a single-lane club</h3>
          <p className="text-[14.5px] text-muted-foreground">
            FRAME is not a traditional academic club, and not an entertainment platform only. It is a
            multidisciplinary frame — built around experience and challenge — where the same standard
            of fairness and design quality applies whether the arena is a chessboard, a football
            pitch, a shoreline clean-up or a charity drive.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Involved() {
  const items = [
    ["Compete", "Join an arena — academic, strategy, sport, culture, coast or community — and start on the pathway from competitor to supported talent.", "See the arenas", "#arenas", "↓"],
    ["Volunteer", "Support FRAME's community and charity initiatives, and help turn each event into concrete, positive impact.", "Learn what FRAME stands for", "#identity", "↓"],
    ["Partner", "FRAME is built with an ambition for regional and international cooperation — for organizations who want to help build that bridge.", "Get in touch", "#top", "↑"],
  ];
  return (
    <section id="involved" className="border-t border-border py-26">
      <div className="wrap">
        <SectionHead
          en="Get involved"
          fr="Participer"
          ar="شارك معنا"
          title="Three ways to be part of FRAME"
          lede="Whether you're stepping into an arena, supporting from the sidelines, or opening doors beyond Mauritania."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {items.map(([t, d, cta, href, arrow], i) => (
            <Reveal key={t} delay={i * 120} className="frame-card flex flex-col gap-3.5">
              <h3 className="text-[20px]">{t}</h3>
              <p className="text-[14.5px] text-muted-foreground">{d}</p>
              <a
                href={href}
                className="mt-auto inline-flex items-center gap-1.5 self-start border-b border-maroon-accent pb-0.5 text-[13.5px] font-semibold text-maroon-accent transition-all duration-300 hover:gap-3"
              >
                {cta} <span>{arrow}</span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Finale() {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  return (
    <section
      id="finale"
      className="relative overflow-hidden bg-maroon-900 py-32 text-[oklch(0.9_0.03_20)]"
    >
      <span
        className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full border border-[oklch(0.7_0.1_20/0.35)]"
        style={{ animation: "spin-slow 60s linear infinite" }}
        aria-hidden
      >
        <span className="absolute inset-10 rounded-full border border-dashed border-[oklch(0.7_0.1_20/0.2)]" />
      </span>
      <Bubbles count={10} />
      <div className="wrap relative z-1">
        <Reveal>
          <Eyebrow en="Final statement" fr="Conclusion" ar="الخلاصة" tone="dark" />
        </Reveal>
        <Reveal delay={100}>
          <h2 className="max-w-[16em] text-[clamp(30px,4.4vw,50px)] leading-[1.18] font-normal text-paper">
            FRAME is more than an event organizer. It is a frame where challenge meets talent,
            enjoyment meets knowledge, and ambition becomes impact.
          </h2>
        </Reveal>
        <span
          ref={ref}
          className="mt-9 block h-0.5 w-16 origin-left bg-maroon-accent transition-transform duration-[800ms] ease-out"
          style={{ transform: inView ? "scaleX(1)" : "scaleX(0)" }}
        />
        <Reveal delay={200} className="mt-8 grid max-w-[640px] gap-4">
          <p dir="rtl" className="text-[16.5px]">
            FRAME ليست مجرد جهة تنظم أحداثًا، بل إطار يلتقي فيه التحدي بالموهبة، والمتعة بالمعرفة،
            والطموح بالأثر.
          </p>
          <p className="text-[15.5px]">
            FRAME n'est pas seulement un organisateur d'événements. C'est un cadre où le défi
            rencontre le talent, le plaisir rencontre le savoir et l'ambition produit de l'impact.
          </p>
        </Reveal>
      </div>
      <WaveDivider className="absolute inset-x-0 bottom-0" />
    </section>
  );
}

function Footer() {
  return (
    <footer className="pt-[70px] pb-14">
      <div className="wrap">
        <div className="flex flex-wrap justify-between gap-10 border-b border-border pb-11">
          <div>
            <a href="#top" className="group flex items-center gap-2.5">
              <FrameMark className="h-[26px] w-[22px] text-maroon-700 transition-transform duration-500 group-hover:-rotate-6" />
              <span className="font-display text-[22px] font-semibold tracking-[0.12em]">FRAME</span>
            </a>
            <p className="mt-3.5 max-w-[32ch] text-[14px] text-muted-foreground">
              A Mauritanian platform bringing together entertainment, competition, knowledge, sport
              and social impact.
            </p>
          </div>
          <div className="flex flex-wrap gap-16">
            <div>
              <h5 className="mb-3.5 text-[12px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Explore
              </h5>
              {[
                ["#identity", "Identity"],
                ["#direction", "Vision & mission"],
                ["#arenas", "Six arenas"],
                ["#water", "The coast"],
                ["#nature", "The land"],
              ].map(([h, l]) => (
                <a key={h} href={h} className="link-underline mb-2.5 block w-fit text-[14.5px]">
                  {l}
                </a>
              ))}
            </div>
            <div>
              <h5 className="mb-3.5 text-[12px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Involved
              </h5>
              {[
                ["#audience", "Who it's for"],
                ["#involved", "Get involved"],
                ["#experience", "Event standard"],
                ["#values", "Values"],
              ].map(([h, l]) => (
                <a key={h} href={h} className="link-underline mb-2.5 block w-fit text-[14.5px]">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 pt-6 text-[13px] text-muted-foreground">
          <span>FRAME — Mauritania. One identity, many arenas.</span>
          <span>Concept document · العربية · Français · English</span>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteChrome />
      <main>
        <Hero />
        <Marquee />
        <Identity />
        <Direction />
        <WaterSection />
        <Journey />
        <Arenas />
        <NatureSection />
        <EventDna />
        <Values />
        <Audience />
        <Involved />
        <Finale />
      </main>
      <Footer />
    </div>
  );
}
