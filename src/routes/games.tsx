import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Gamepad2,
  Trophy,
  Play,
  X,
  ExternalLink,
  ChevronRight,
  Flame,
} from "lucide-react";
import AnimatedList from "@/components/fx/AnimatedList";
import GradientWaves from "@/components/fx/GradientWaves";
import ParticleText from "@/components/ParticleText";
import { listProfiles, displayName, type Profile } from "@/lib/profiles";
import { t, useLang } from "@/hooks/use-lang";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { MemberAvatar } from "@/components/frame/MemberAvatar";
import { MemberProfileModal } from "@/components/frame/MemberProfileModal";
import type { FullProfile } from "@/lib/social";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Games & Arena — FRAME Mauritania" },
      {
        name: "description",
        content:
          "Compete in FRAME official challenges, climb the leaderboard, view members, and earn points.",
      },
      { property: "og:title", content: "Games & Arena — FRAME Mauritania" },
      {
        property: "og:description",
        content: "Play official challenges, connect with members, and rank up on FRAME leaderboards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamesPage,
});

type GamePlugin = {
  id: string;
  title: string;
  description: string | null;
  kind: "builtin" | "embed";
  builtin_key: string | null;
  embed_url: string | null;
  points_reward: number;
  status: string;
  thumbnail_url: string | null;
};

function rankTitle(points: number) {
  if (points >= 3000) return { en: "Veteran", fr: "Vétéran", ar: "مخضرم" };
  if (points >= 1500) return { en: "Contender", fr: "Prétendant", ar: "منافس" };
  return { en: "Rising", fr: "Montant", ar: "صاعد" };
}

function GamesPage() {
  const { lang } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [games, setGames] = useState<GamePlugin[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<GamePlugin | null>(null);
  const [lastAwarded, setLastAwarded] = useState<number | null>(null);
  const [awarding, setAwarding] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FullProfile | null>(null);

  // Fetch games catalog & profiles, purging built-in defaults
  useEffect(() => {
    let alive = true;

    // Purge unwanted default games from database if they exist
    void Promise.resolve(
      supabase
        .from("game_plugins")
        .delete()
        .or("builtin_key.eq.reaction,builtin_key.eq.memory,title.ilike.%reaction rush%,title.ilike.%memory grid%"),
    )
      .then(() => undefined)
      .catch(() => undefined);

    Promise.all([
      supabase
        .from("game_plugins")
        .select("*")
        .neq("status", "hidden")
        .order("created_at", { ascending: false }),
      listProfiles(),
    ])
      .then(([gamesRes, profs]) => {
        if (!alive) return;
        const validGames = ((gamesRes.data ?? []) as GamePlugin[]).filter(
          (g) =>
            g.builtin_key !== "reaction" &&
            g.builtin_key !== "memory" &&
            !g.title.toLowerCase().includes("reaction rush") &&
            !g.title.toLowerCase().includes("memory grid"),
        );
        setGames(validGames);
        setProfiles(profs);
      })
      .catch(() => {
        if (alive) {
          setGames([]);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const handleScoreFinish = async (game: GamePlugin, score: number) => {
    if (!user) return;
    setAwarding(true);
    try {
      if (!game.id.startsWith("default-")) {
        await supabase.from("game_scores").insert({
          game_id: game.id,
          user_id: user.id,
          score,
        });
      }
      setLastAwarded(game.points_reward);
    } catch {
      // non-fatal
    } finally {
      setAwarding(false);
    }
  };

  const top = useMemo(() => profiles.slice(0, 10), [profiles]);
  const rest = useMemo(() => profiles.slice(10), [profiles]);

  const openProfile = (p: Profile) => {
    setSelectedMember({
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      cover_url: p.cover_url ?? null,
      bio: p.bio ?? null,
      location: p.location ?? null,
      talents: p.talents ?? [],
      interests: p.interests ?? [],
      social_links: p.social_links ?? {},
      show_online: p.show_online ?? false,
      last_seen: p.last_seen ?? null,
      points: p.points ?? 0,
      contributions: p.contributions ?? 0,
    });
  };

  return (
    <main className="pt-[92px]">
      <section className="wrap pt-6">
        <p className="text-[12px] font-semibold tracking-[0.28em] text-maroon-accent uppercase">
          {t(lang, { en: "Arena & Leaderboard", fr: "Arène & Classement", ar: "الحلبة والتصنيف" })}
        </p>
        <ParticleText
          text={t(lang, { en: "ARENA", fr: "ARÈNE", ar: "الحلبة" })}
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
          trigger="mount"
          fontSize="clamp(3.5rem, 13vw, 9rem)"
          fontWeight={500}
          fontFamily="inherit"
          glow
          className="mt-2"
          style={{ height: "clamp(180px, 26vw, 300px)" }}
        />
      </section>

      {/* Games Catalog Section */}
      <section className="wrap pb-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-[28px]">
              {t(lang, {
                en: "Challenges & Games",
                fr: "Défis & Jeux",
                ar: "التحديات والألعاب",
              })}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t(lang, {
                en: "Official competitions and games published by FRAME admins.",
                fr: "Compétitions officielles et jeux publiés par les administrateurs FRAME.",
                ar: "المسابقات والألعاب الرسمية المضافة من قبل المشرفين.",
              })}
            </p>
          </div>
        </div>

        {games.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-maroon-700/10 text-maroon-accent">
              <Gamepad2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold">
              {t(lang, {
                en: "Challenges & Games Catalog",
                fr: "Catalogue de Défis et Jeux",
                ar: "كتالوج التحديات والألعاب",
              })}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {t(lang, {
                en: "Official games and tournaments added by the administration in the control room will appear here.",
                fr: "Les jeux officiels et tournois ajoutés par l'administration apparaîtront ici.",
                ar: "ستظهر هنا الألعاب والمسابقات الرسمية التي يضيفها المشرف من لوحة التحكم.",
              })}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => {
              const isSoon = g.status === "soon";
              return (
                <div
                  key={g.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-maroon-accent/50 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-lg bg-maroon-700/10 text-maroon-accent">
                        <Gamepad2 className="h-6 w-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Trophy className="h-3 w-3" />+{g.points_reward} pts
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-[20px]">{g.title}</h3>
                    <p className="mt-2 text-[14px] text-muted-foreground line-clamp-3">
                      {g.description ||
                        t(lang, {
                          en: "Test your talent in this interactive FRAME challenge.",
                          fr: "Testez votre talent dans ce défi interactif FRAME.",
                          ar: "اختبر موهبتك في هذا التحدي التفاعلي من FRAME.",
                        })}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/60">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      {isSoon
                        ? t(lang, { en: "Coming soon", fr: "Bientôt", ar: "قريباً" })
                        : g.kind === "embed"
                          ? t(lang, { en: "Web Game", fr: "Jeu Web", ar: "لعبة ويب" })
                          : t(lang, { en: "Interactive", fr: "Interactif", ar: "تفاعلي" })}
                    </span>

                    <button
                      type="button"
                      disabled={isSoon}
                      onClick={() => {
                        setActiveGame(g);
                        setLastAwarded(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[image:var(--gradient-ember)] px-4 py-1.5 text-xs font-semibold text-paper shadow transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      {isSoon
                        ? t(lang, { en: "Locked", fr: "Verrouillé", ar: "مغلق" })
                        : t(lang, { en: "Play", fr: "Jouer", ar: "العب" })}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Leaderboard Section */}
      <section className="wrap pb-14 border-t border-border pt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-[26px]">
              {t(lang, { en: "Community & Leaderboard", fr: "Communauté & Classement", ar: "المجتمع ولوحة الصدارة" })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(lang, {
                en: "Click any member to inspect their full profile and send private messages.",
                fr: "Cliquez sur un membre pour voir son profil et lui envoyer un message privé.",
                ar: "انقر على أي عضو لمشاهدة ملفه الكامل ومراسلته بشكل خاص.",
              })}
            </p>
          </div>
        </div>

        {loading && (
          <p className="text-[14px] text-muted-foreground">
            {t(lang, {
              en: "Loading leaderboard…",
              fr: "Chargement du classement…",
              ar: "جارٍ تحميل لوحة الصدارة…",
            })}
          </p>
        )}

        {!loading && profiles.length === 0 && (
          <p className="text-[15px] text-muted-foreground">
            {t(lang, {
              en: "No members yet. Complete your profile to appear on the leaderboard.",
              fr: "Aucun membre pour l'instant. Complétez votre profil pour apparaître au classement.",
              ar: "لا يوجد أعضاء بعد. أكمل ملفك لتظهر في لوحة الصدارة.",
            })}
          </p>
        )}

        {!loading && profiles.length > 0 && (
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Top Leaderboard */}
            <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-display text-[20px] font-bold">
                  {t(lang, { en: "Top Ranked", fr: "Les Meilleurs", ar: "المتصدرون" })}
                </h3>
              </div>
              <AnimatedList
                className="space-y-2"
                items={top.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openProfile(p)}
                    className="w-full text-left flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted/80 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-display text-[20px] font-bold text-maroon-accent w-7 text-center shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <MemberAvatar
                        avatarUrl={p.avatar_url}
                        name={p.full_name}
                        username={p.username}
                        size="md"
                        showStatus={p.show_online}
                        isOnline={p.show_online}
                      />
                      <div className="min-w-0">
                        <div className="font-display text-[16px] font-semibold truncate group-hover:text-maroon-700 transition-colors">
                          {displayName(p)}
                        </div>
                        <div className="text-[12px] text-muted-foreground truncate">
                          {p.username ? `@${p.username}` : (p.talents?.[0] ?? "—")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-display text-[16px] font-bold text-foreground">
                        {p.points} <span className="text-xs font-normal text-muted-foreground">pts</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              />
            </div>

            {/* All Members */}
            <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-maroon-accent" />
                <h3 className="font-display text-[20px] font-bold">
                  {t(lang, { en: "All Talents", fr: "Tous les Talents", ar: "كافة المواهب" })}
                </h3>
              </div>
              <AnimatedList
                className="space-y-2 max-h-[500px] overflow-y-auto pr-1"
                items={(rest.length > 0 ? rest : profiles).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openProfile(p)}
                    className="w-full text-left flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted/80 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <MemberAvatar
                        avatarUrl={p.avatar_url}
                        name={p.full_name}
                        username={p.username}
                        size="md"
                        showStatus={p.show_online}
                        isOnline={p.show_online}
                      />
                      <div className="min-w-0">
                        <div className="font-display text-[16px] font-semibold truncate group-hover:text-maroon-700 transition-colors">
                          {displayName(p)}
                        </div>
                        <div className="text-[12px] text-muted-foreground truncate">
                          {p.username ? `@${p.username}` : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="pc-tag text-xs">{t(lang, rankTitle(p.points))}</span>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {p.contributions}{" "}
                        {t(lang, {
                          en: "contributions",
                          fr: "contribs",
                          ar: "مساهمة",
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              />
            </div>
          </div>
        )}
      </section>

      {/* Game Modal (for Admin Added Embed Games) */}
      {activeGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-maroon-700/10 text-maroon-accent">
                  <Gamepad2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold leading-none">
                    {activeGame.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    +{activeGame.points_reward}{" "}
                    {t(lang, { en: "Points reward", fr: "Points accordés", ar: "نقاط مكافأة" })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveGame(null);
                  setLastAwarded(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-6">
              {activeGame.embed_url ? (
                <div className="flex flex-col items-center">
                  <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
                    <iframe
                      src={activeGame.embed_url}
                      title={activeGame.title}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  </div>
                  <div className="mt-4 flex w-full items-center justify-between">
                    <a
                      href={activeGame.embed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t(lang, { en: "Open fullscreen", fr: "Plein écran", ar: "فتح ملء الشاشة" })}
                    </a>
                    <button
                      type="button"
                      disabled={awarding}
                      onClick={() => void handleScoreFinish(activeGame, 100)}
                      className="rounded-lg bg-[image:var(--gradient-ember)] px-4 py-1.5 text-xs font-semibold text-paper"
                    >
                      {t(lang, {
                        en: "Claim points",
                        fr: "Réclamer les points",
                        ar: "استلام النقاط",
                      })}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {t(lang, {
                    en: "This game does not have an active URL configuration.",
                    fr: "Ce jeu n'a pas d'URL configurée.",
                    ar: "لا يوجد رابط تشغيل لهذه اللعبة حالياً.",
                  })}
                </p>
              )}
            </div>

            {lastAwarded !== null && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {t(lang, {
                  en: `🎉 +${lastAwarded} FRAME Points recorded! Keep playing to sharpen your talent.`,
                  fr: `🎉 +${lastAwarded} Points FRAME enregistrés ! Continuez à jouer.`,
                  ar: `🎉 تم تسجيل +${lastAwarded} نقطة FRAME! واصل اللعب لتنمية موهبتك.`,
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      <MemberProfileModal
        member={selectedMember}
        open={Boolean(selectedMember)}
        onOpenChange={(isOpen) => !isOpen && setSelectedMember(null)}
      />

      <GradientWaves flip />
    </main>
  );
}
export default GamesPage;
