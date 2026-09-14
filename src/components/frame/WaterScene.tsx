const WAVE_PATH =
  "M0,60 C120,110 240,10 360,60 C480,110 600,10 720,60 C840,110 960,10 1080,60 C1200,110 1320,10 1440,60 L1440,160 L0,160 Z";

/** A layered, endlessly sliding wave divider. Flip it for the top of a section. */
export function WaveDivider({
  flip = false,
  className = "",
}: {
  flip?: boolean;
  className?: string;
}) {
  const layers = [
    { color: "var(--water-light)", opacity: 0.35, dur: 18, height: 90 },
    { color: "var(--water)", opacity: 0.45, dur: 13, height: 74 },
    { color: "var(--water-deep)", opacity: 0.9, dur: 9, height: 58 },
  ];
  return (
    <div
      className={`pointer-events-none relative w-full overflow-hidden ${className}`}
      style={{ height: 96, transform: flip ? "rotate(180deg)" : undefined }}
      aria-hidden
    >
      {layers.map((l, i) => (
        <div
          key={i}
          className="wave-band absolute bottom-0 left-0"
          style={{ height: l.height, animationDuration: `${l.dur}s`, opacity: l.opacity }}
        >
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none">
            <path d={WAVE_PATH} fill={l.color} />
          </svg>
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none">
            <path d={WAVE_PATH} fill={l.color} />
          </svg>
        </div>
      ))}
    </div>
  );
}

export function Bubbles({ count = 14 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const size = 4 + ((i * 7) % 11);
        return (
          <span
            key={i}
            className="absolute rounded-full bg-[oklch(1_0_0/0.5)]"
            style={{
              width: size,
              height: size,
              left: `${(i * 97) % 100}%`,
              bottom: `${(i * 13) % 40}%`,
              animation: `bubble-rise ${7 + (i % 6)}s linear ${i * 0.7}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export function Ripples() {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute h-40 w-40 rounded-full border border-[oklch(1_0_0/0.45)]"
          style={{ animation: `ripple-out 5s ease-out ${i * 1.25}s infinite` }}
        />
      ))}
    </div>
  );
}

/** Full ocean panel: gradient water, swell, bubbles, ripples, caustic light. */
export function WaterScene({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden bg-[var(--gradient-water)]">
      <div
        className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,oklch(1_0_0/0.35),transparent_70%)]"
        style={{ animation: "sun-glow 8s ease-in-out infinite" }}
        aria-hidden
      />
      <Ripples />
      <Bubbles />
      <div
        className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,oklch(0.36_0.075_224/0.85))]"
        style={{ animation: "swell 6s ease-in-out infinite" }}
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
