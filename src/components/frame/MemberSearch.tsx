import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { displayName, listProfiles, type Profile } from "@/lib/profiles";
import { t, useLang } from "@/hooks/use-lang";

export function MemberSearch() {
  const { lang } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    let alive = true;
    void listProfiles().then((rows) => {
      if (alive) setProfiles(rows);
    }).catch(() => undefined);
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

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`flex h-9 items-center overflow-hidden rounded-full border bg-card/75 shadow-[var(--shadow-search)] backdrop-blur-xl transition-[width,border-color,box-shadow] duration-300 ${
          open ? "w-[260px] border-maroon-accent" : "w-9 border-border"
        }`}
      >
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center text-maroon-accent"
          aria-label={t(lang, { en: "Search members", fr: "Rechercher des membres", ar: "البحث عن الأعضاء" })}
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4" />
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          placeholder={t(lang, { en: "Find a username…", fr: "Trouver un pseudo…", ar: "ابحث عن اسم مستخدم…" })}
          aria-label={t(lang, { en: "Member username", fr: "Pseudo du membre", ar: "اسم المستخدم" })}
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
        <div className="absolute end-0 top-12 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-md border border-border bg-popover/95 p-1.5 shadow-[var(--shadow-search)] backdrop-blur-xl">
          {matches.length > 0 ? (
            matches.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between gap-4 rounded-sm px-3 py-2.5 hover:bg-muted">
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold">{displayName(profile)}</div>
                  <div className="truncate text-[12px] text-muted-foreground">
                    {profile.username ? `@${profile.username}` : profile.talents?.[0] ?? "—"}
                  </div>
                </div>
                <span className="shrink-0 text-[12px] font-semibold text-maroon-accent">{profile.points} pts</span>
              </div>
            ))
          ) : (
            <p className="px-3 py-3 text-[12.5px] text-muted-foreground">
              {t(lang, { en: "No member found", fr: "Aucun membre trouvé", ar: "لم يتم العثور على عضو" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}