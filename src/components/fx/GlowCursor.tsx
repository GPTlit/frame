import { useEffect, useRef } from "react";

/** A soft red/violet glow that trails the pointer. Purely decorative. */
export default function GlowCursor({ size = 420 }: { size?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = "1";
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };
    const tick = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [size]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-90 opacity-0 mix-blend-plus-lighter transition-opacity duration-500 max-md:hidden"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle, color-mix(in oklab, var(--maroon-accent) 30%, transparent) 0%, color-mix(in oklab, var(--violet-accent) 18%, transparent) 38%, transparent 68%)",
        filter: "blur(18px)",
        willChange: "transform",
      }}
    />
  );
}
