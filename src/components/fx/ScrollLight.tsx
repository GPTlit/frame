import { useEffect, useRef } from "react";

/**
 * Ambient light beams that follow the scroll position (and a finger on touch
 * devices). Decorative only, fixed behind the page content.
 */
export default function ScrollLight() {
  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = 0;
    let current = 0;
    let raf = 0;

    const read = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      target = max > 0 ? doc.scrollTop / max : 0;
    };

    const tick = () => {
      current += (target - current) * (reduce ? 1 : 0.08);
      const vh = window.innerHeight;
      if (topRef.current) {
        topRef.current.style.transform = `translate3d(0, ${current * vh * 0.9 - vh * 0.2}px, 0)`;
        topRef.current.style.opacity = String(0.35 + current * 0.35);
      }
      if (bottomRef.current) {
        bottomRef.current.style.transform = `translate3d(0, ${vh * 0.55 - current * vh * 0.7}px, 0)`;
      }
      if (barRef.current) {
        barRef.current.style.transform = `translate3d(0, ${current * (vh - 140)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        ref={topRef}
        className="absolute -left-[20%] h-[55vh] w-[140%] blur-[70px]"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 50%, color-mix(in oklab, var(--maroon-accent) 26%, transparent), transparent 70%)",
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={bottomRef}
        className="absolute -right-[20%] h-[50vh] w-[130%] blur-[80px]"
        style={{
          background:
            "radial-gradient(55% 50% at 70% 50%, color-mix(in oklab, var(--violet-accent) 24%, transparent), transparent 72%)",
          willChange: "transform",
        }}
      />
      <div
        ref={barRef}
        className="absolute top-0 left-0 h-[140px] w-[3px]"
        style={{
          background:
            "linear-gradient(180deg, transparent, var(--maroon-accent), var(--violet-accent), transparent)",
          filter: "blur(1.5px)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
