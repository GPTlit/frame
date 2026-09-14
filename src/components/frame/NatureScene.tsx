export function Palm({
  className = "",
  delay = 0,
  scale = 1,
}: {
  className?: string;
  delay?: number;
  scale?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 200"
      className={className}
      style={{
        transformOrigin: "50% 100%",
        animation: `palm-sway ${5 + delay}s ease-in-out ${delay}s infinite`,
        transform: `scale(${scale})`,
      }}
      aria-hidden
    >
      <path
        d="M60 200 C58 150 56 110 54 70"
        stroke="var(--sand-deep)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {[
        "M54 70 C30 52 14 54 4 64 C24 62 40 68 54 76",
        "M54 70 C78 50 96 52 108 62 C86 60 68 66 54 76",
        "M54 70 C40 44 22 34 8 34 C28 42 44 56 54 76",
        "M54 70 C68 42 88 32 104 32 C84 42 66 56 54 76",
        "M54 70 C52 42 56 22 62 10 C64 34 60 56 56 76",
      ].map((d, i) => (
        <path key={i} d={d} fill="var(--palm)" opacity={0.85 - i * 0.06} />
      ))}
    </svg>
  );
}

export function SandParticles({ count = 22 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute h-[3px] w-[3px] rounded-full bg-[var(--sand-deep)]"
          style={{
            left: `${(i * 41) % 100}%`,
            top: `${(i * 29) % 100}%`,
            animation: `sand-float ${9 + (i % 7)}s linear ${i * 0.5}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function Birds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute"
          style={{
            top: `${12 + i * 9}%`,
            animation: `bird-fly ${26 + i * 7}s linear ${i * 6}s infinite`,
          }}
        >
          <svg
            viewBox="0 0 40 16"
            width={26 - i * 5}
            style={{ animation: `flap ${0.7 + i * 0.15}s ease-in-out infinite` }}
          >
            <path
              d="M2 10 C8 2 14 2 20 9 C26 2 32 2 38 10"
              stroke="var(--maroon-900)"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}

export function Leaves({ count = 10 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute h-3 w-1.5 rounded-full bg-[var(--palm-light)] opacity-70"
          style={{
            left: `${(i * 53) % 100}%`,
            animation: `leaf-fall ${13 + (i % 6) * 2}s linear ${i * 1.6}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** Layered dunes with a breathing sun, swaying palms, drifting sand and birds. */
export function DuneScene() {
  return (
    <div className="relative isolate h-[420px] w-full overflow-hidden bg-[var(--gradient-dusk)]">
      <div
        className="absolute top-[16%] left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.95_0.09_80),transparent_65%)]"
        style={{ animation: "sun-glow 7s ease-in-out infinite" }}
        aria-hidden
      />
      <Birds />
      <SandParticles />
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[62%] w-full"
        aria-hidden
      >
        <path
          d="M0,190 C220,120 420,220 700,170 C980,120 1200,210 1440,150 L1440,320 L0,320 Z"
          fill="var(--sand)"
          opacity="0.75"
        />
        <path
          d="M0,240 C240,180 460,270 760,220 C1040,175 1240,255 1440,215 L1440,320 L0,320 Z"
          fill="var(--sand-deep)"
          opacity="0.85"
        />
        <path
          d="M0,285 C260,245 520,305 820,270 C1100,240 1280,295 1440,275 L1440,320 L0,320 Z"
          fill="var(--maroon-700)"
          opacity="0.55"
        />
      </svg>
      <Palm className="absolute bottom-[14%] left-[8%] h-40" delay={0} />
      <Palm className="absolute bottom-[10%] left-[20%] h-28 opacity-80" delay={1.4} />
      <Palm className="absolute bottom-[16%] right-[12%] h-36 opacity-90" delay={0.8} />
      <Leaves />
    </div>
  );
}
