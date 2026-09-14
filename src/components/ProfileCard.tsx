import { useCallback, useRef, type CSSProperties } from "react";

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);

export type ProfileCardProps = {
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  avatarUrl?: string;
  initials?: string;
  tags?: string[];
  rank?: string;
  contributions?: number;
  onContactClick?: () => void;
  className?: string;
};

/** Tilting holographic member card, red + violet. */
export default function ProfileCard({
  name = "Your name",
  title = "Talent",
  handle = "handle",
  status = "Online",
  contactText = "Contact",
  avatarUrl,
  initials,
  tags = [],
  rank = "Unranked",
  contributions = 0,
  onContactClick,
  className = "",
}: ProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const px = clamp((100 / rect.width) * (e.clientX - rect.left));
    const py = clamp((100 / rect.height) * (e.clientY - rect.top));
    wrap.style.setProperty("--pointer-x", `${px}%`);
    wrap.style.setProperty("--pointer-y", `${py}%`);
    wrap.style.setProperty("--rotate-x", `${(-(px - 50) / 6).toFixed(2)}deg`);
    wrap.style.setProperty("--rotate-y", `${((py - 50) / 5).toFixed(2)}deg`);
    wrap.style.setProperty("--card-opacity", "1");
  }, []);

  const onLeave = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.style.setProperty("--rotate-x", "0deg");
    wrap.style.setProperty("--rotate-y", "0deg");
    wrap.style.setProperty("--card-opacity", "0");
  }, []);

  const badge = initials ?? name.slice(0, 2).toUpperCase();

  return (
    <div
      ref={wrapRef}
      className={`pc-wrap ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ "--pointer-x": "50%", "--pointer-y": "50%" } as CSSProperties}
    >
      <div className="pc-glow" aria-hidden />
      <article className="pc-card">
        <div className="pc-shine" aria-hidden />
        <div className="pc-grid" aria-hidden />
        <header className="relative z-2 flex items-start justify-between">
          <span className="pill">{rank}</span>
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-maroon-accent">
            {status}
          </span>
        </header>

        <div className="relative z-2 mt-8 flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${name} profile picture`}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-maroon-accent/60"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(145deg,var(--maroon-700),var(--violet-700))] font-display text-[20px] text-white">
              {badge}
            </span>
          )}
          <div>
            <h3 className="text-[22px] leading-tight">{name}</h3>
            <p className="text-[13.5px] text-muted-foreground">
              {title} · @{handle}
            </p>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="relative z-2 mt-6 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="pc-tag">
                {t}
              </span>
            ))}
          </div>
        )}

        <footer className="relative z-2 mt-8 flex items-center justify-between border-t border-border pt-4">
          <span className="text-[13px] text-muted-foreground">
            <strong className="font-display text-[18px] text-foreground">{contributions}</strong>{" "}
            contributions
          </span>
          <button
            type="button"
            onClick={onContactClick}
            className="rounded-sm border border-maroon-accent px-4 py-1.5 text-[12.5px] font-semibold text-maroon-accent transition-colors hover:bg-maroon-accent hover:text-white"
          >
            {contactText}
          </button>
        </footer>
      </article>
    </div>
  );
}
