import { useEffect, useRef, useState, type ReactNode } from "react";

/** A scroll-aware list that fades each row in and highlights the hovered one. */
export default function AnimatedList({
  items,
  onSelect,
  className = "",
}: {
  items: ReactNode[];
  onSelect?: (index: number) => void;
  className?: string;
}) {
  const ref = useRef<HTMLUListElement | null>(null);
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <ul ref={ref} className={`grid gap-2 ${className}`}>
      {items.map((item, i) => (
        <li
          key={i}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
          onClick={() => onSelect?.(i)}
          className={`animated-row ${shown ? "is-in" : ""} ${active === i ? "is-active" : ""}`}
          style={{ transitionDelay: `${i * 70}ms` }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
