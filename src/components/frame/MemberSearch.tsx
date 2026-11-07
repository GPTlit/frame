import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { displayName, listProfiles, type Profile } from "@/lib/profiles";
import { t, useLang } from "@/hooks/use-lang";
import { MemberAvatar } from "@/components/frame/MemberAvatar";
import { MemberProfileModal } from "@/components/frame/MemberProfileModal";
import type { FullProfile } from "@/lib/social";

export function MemberSearch() {
  const { lang } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    let alive = true;
    void listProfiles()
      .then((rows) => {
        if (alive) setProfiles(rows);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];
    return profiles
      .filter((profile) =>
        [profile.username, profile.full_name, ...(profile.talents ?? [])]
          .filter(Boolean)
          .some((value) => value?.toLocaleLowerCase().includes(needle)),
      )
      .slice(0, 6);
  }, [profiles, query]);

  const [selectedMember, setSelectedMember] = useState<FullProfile | null>(null);

  return (
    <>
      <div ref={rootRef} className="relative">
        <div
          className={`flex h-9 items-center overflow-hidden rounded-full border bg-card/75 shadow-[var(--shadow-search)] backdrop-blur-xl transition-[width,border-color,box-shadow] duration-300 ${
            open ? "w-[260px] border-maroon-accent" : "w-9 border-border"
          }`}
        >
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center text-maroon-accent"
            aria-label={t(lang, {
              en: "Search members",
              fr: "Rechercher des membres",
              ar: "البحث عن الأعضاء",
            })}
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" />
          </button>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            placeholder={t(lang, {
              en: "Find a username…",
              fr: "Trouver un pseudo…",
              ar: "ابحث عن اسم مستخدم…",
            })}
            aria-label={t(lang, {
              en: "Member username",
              fr: "Pseudo du membre",
              ar: "اسم المستخدم",
            })}
          />
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
            aria-label={t(lang, { en: "Close search", fr: "Fermer la recherche", ar: "إغلاق البحث" })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {open && query.trim() && (
          <div className="absolute end-0 top-12 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-xl border border-border bg-popover/95 p-1.5 shadow-xl backdrop-blur-xl z-80">
            {matches.length > 0 ? (
              matches.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    setSelectedMember({
                      id: profile.id,
                      username: profile.username,
                      full_name: profile.full_name,
                      avatar_url: profile.avatar_url,
                      cover_url: profile.cover_url ?? null,
                      bio: profile.bio ?? null,
                      location: profile.location ?? null,
                      talents: profile.talents ?? [],
                      interests: profile.interests ?? [],
                      social_links: profile.social_links ?? {},
                      show_online: profile.show_online ?? false,
                      last_seen: profile.last_seen ?? null,
                      points: profile.points ?? 0,
                      contributions: profile.contributions ?? 0,
                    });
                    setOpen(false);
                  }}
                  className="w-full text-left flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberAvatar
                      avatarUrl={profile.avatar_url}
                      name={profile.full_name}
                      username={profile.username}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-semibold text-foreground">
                        {displayName(profile)}
                      </div>
                      <div className="truncate text-[12px] text-muted-foreground">
                        {profile.username ? `@${profile.username}` : (profile.talents?.[0] ?? "—")}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] font-semibold text-maroon-accent">
                    {profile.points} pts
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-[12.5px] text-muted-foreground">
                {t(lang, {
                  en: "No member found",
                  fr: "Aucun membre trouvé",
                  ar: "لم يتم العثور على عضو",
                })}
              </p>
            )}
          </div>
        )}
      </div>

      <MemberProfileModal
        member={selectedMember}
        open={Boolean(selectedMember)}
        onOpenChange={(isOpen) => !isOpen && setSelectedMember(null)}
      />
    </>
  );
}
