import { useEffect, useState, type ReactNode } from "react";

/** A stack of cards that continuously swaps the front card to the back. */
export default function CardSwap({
  cards,
  interval = 3800,
  className = "",
}: {
  cards: ReactNode[];
  interval?: number;
  className?: string;
}) {
  const [order, setOrder] = useState(() => cards.map((_, i) => i));

  useEffect(() => {
    if (cards.length < 2) return;
    const id = setInterval(() => {
      setOrder((o) => [...o.slice(1), o[0]!]);
    }, interval);
    return () => clearInterval(id);
  }, [cards.length, interval]);

  return (
    <div className={`relative ${className}`} style={{ perspective: "1200px" }}>
      {order.map((cardIndex, slot) => (
        <div
          key={cardIndex}
          className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translate3d(${slot * 22}px, ${slot * -16}px, ${slot * -70}px) rotateY(${slot * -5}deg)`,
            zIndex: order.length - slot,
            opacity: slot > 2 ? 0 : 1 - slot * 0.18,
            pointerEvents: slot === 0 ? "auto" : "none",
          }}
        >
          {cards[cardIndex]}
        </div>
      ))}
    </div>
  );
}
