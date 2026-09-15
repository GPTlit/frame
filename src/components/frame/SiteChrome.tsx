import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { LANGS, useLang } from "@/hooks/use-lang";

const LINKS = [
  { href: "/#identity", label: "Identity" },
  { href: "/#direction", label: "Vision" },
  { href: "/#water", label: "Coast" },
  { href: "/#arenas", label: "Arenas" },
  { href: "/#nature", label: "Land" },
  { href: "/#values", label: "Values" },
  { href: "/#involved", label: "Get involved" },
];


export function FrameMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 46" fill="none" className={className}>
      <path
        d="M4 2H36C37.5 2 38 3 38 4V14C38 15.5 37 16 36 16H16V44H4V2Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function SiteChrome() {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLang();


  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setScrolled(window.scrollY > 30);
      setProgress((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 || 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="rail" aria-hidden>
        <span className="absolute inset-y-[12%] left-[60%] w-px bg-[oklch(1_0_0/0.35)]" />
      </div>

      <div className="fixed top-0 right-0 left-[var(--rail-w)] z-80 h-[2px]">
        <div
          className="h-full bg-[linear-gradient(90deg,var(--maroon-700),var(--maroon-accent))] transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header
        className={`fixed top-0 right-0 left-[var(--rail-w)] z-70 border-b border-border backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? "bg-background/95 shadow-[var(--shadow-nav)]"
            : "bg-background/80"
        }`}
      >
        <div
          className={`wrap flex items-center justify-between transition-all duration-300 ${
            scrolled ? "h-[60px]" : "h-[72px]"
          }`}
        >
          <a href="#top" className="group flex items-center gap-2.5">
            <FrameMark className="h-[26px] w-[22px] text-maroon-700 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
            <span className="font-display text-[19px] font-semibold tracking-[0.12em]">FRAME</span>
          </a>

          <nav className="hidden gap-[34px] lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="link-underline py-1 text-[14.5px] font-medium hover:text-maroon-700"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div
              className="flex overflow-hidden rounded-full border border-border"
              role="group"
              aria-label="Language"
            >
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`px-2.5 py-1 text-[11.5px] font-semibold tracking-[0.1em] transition-colors duration-300 ${
                    lang === l.code
                      ? "bg-[image:var(--gradient-ember)] text-paper"
                      : "text-muted-foreground hover:text-maroon-accent"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button

              type="button"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-full border border-border p-2 text-maroon-accent transition-colors duration-300 hover:border-maroon-accent hover:bg-maroon-accent/10"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <a
              href="#involved"
              className="hidden rounded-sm border border-foreground px-[18px] py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors duration-300 hover:bg-foreground hover:text-paper lg:inline-block"
            >
              Partner with us
            </a>
          </div>


          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="p-1.5 lg:hidden"
          >
            <span
              className={`block h-0.5 w-[22px] bg-foreground transition-transform duration-300 ${open ? "translate-y-[7px] rotate-45" : ""}`}
            />
            <span
              className={`my-[5px] block h-0.5 w-[22px] bg-foreground transition-opacity duration-300 ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-[22px] bg-foreground transition-transform duration-300 ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-y-0 right-0 left-[var(--rail-w)] top-[64px] z-65 overflow-y-auto bg-paper px-6 py-8 lg:hidden">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block animate-fade-in border-b border-border py-3.5 font-display text-[26px]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
