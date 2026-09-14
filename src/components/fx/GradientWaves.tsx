/** Slow-sliding layered gradient waves in red / violet. */
const PATH =
  "M0,64 C160,120 320,8 480,64 C640,120 800,8 960,64 C1120,120 1280,8 1440,64 L1440,180 L0,180 Z";

export default function GradientWaves({
  className = "",
  height = 180,
  flip = false,
}: {
  className?: string;
  height?: number;
  flip?: boolean;
}) {
  const layers = [
    { from: "var(--violet-accent)", to: "var(--maroon-accent)", o: 0.22, dur: 22, h: 1 },
    { from: "var(--maroon-700)", to: "var(--violet-700)", o: 0.3, dur: 15, h: 0.82 },
    { from: "var(--maroon-900)", to: "var(--violet-700)", o: 0.42, dur: 10, h: 0.64 },
  ];
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative w-full overflow-hidden ${className}`}
      style={{ height, transform: flip ? "rotate(180deg)" : undefined }}
    >
      {layers.map((l, i) => (
        <div
          key={i}
          className="wave-band absolute bottom-0 left-0"
          style={{ height: height * l.h, animationDuration: `${l.dur}s`, opacity: l.o }}
        >
          {[0, 1].map((k) => (
            <svg key={k} viewBox="0 0 1440 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`gw-${i}-${k}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={l.from} />
                  <stop offset="100%" stopColor={l.to} />
                </linearGradient>
              </defs>
              <path d={PATH} fill={`url(#gw-${i}-${k})`} />
            </svg>
          ))}
        </div>
      ))}
    </div>
  );
}
