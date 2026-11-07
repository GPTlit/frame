import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Moon, Sun, Globe, ChevronDown, Check } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { LANGS, useLang, t } from "@/hooks/use-lang";
import { useAuth } from "@/hooks/use-auth";
import { MemberSearch } from "@/components/frame/MemberSearch";

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
    <img
      src="/frame-logo.png"
      alt="FRAME"
      className={`object-contain dark:brightness-0 dark:invert ${className}`}
      draggable={false}
    />
  );
}

export function SiteChrome() {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLang();
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          scrolled ? "bg-background/95 shadow-[var(--shadow-nav)]" : "bg-background/80"
        }`}
      >
        <div
          className={`wrap flex items-center justify-between transition-all duration-300 ${
            scrolled ? "h-[76px]" : "h-[88px]"
          }`}
        >
          <a href="#top" className="group flex items-center gap-2.5">
            <FrameMark className="h-11 w-10 text-maroon-700 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
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
            <div className="hidden md:block">
              <MemberSearch />
            </div>
            {/* Compact Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[12px] font-semibold text-foreground hover:border-maroon-accent hover:bg-maroon-accent/5 transition-colors"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label="Change language"
              >
                <Globe className="h-3.5 w-3.5 text-maroon-accent" />
                <span className="uppercase tracking-wider text-[11px] font-bold">{lang}</span>
                <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-border bg-background/95 p-1 shadow-xl backdrop-blur-md z-80 animate-in fade-in zoom-in-95 duration-150">
                  {LANGS.map((l) => {
                    const fullNames: Record<string, string> = {
                      en: "English",
                      fr: "Français",
                      ar: "العربية",
                    };
                    const isSelected = lang === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLang(l.code);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-maroon-700/10 text-maroon-700 font-semibold dark:text-maroon-300"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-bold text-[11px] text-muted-foreground uppercase">{l.code}</span>
                          <span>{fullNames[l.code] || l.label}</span>
                        </span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-maroon-700 dark:text-maroon-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-full border border-border p-2 text-maroon-accent transition-colors duration-300 hover:border-maroon-accent hover:bg-maroon-accent/10"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <Link
                to="/profile"
                className="inline-flex items-center rounded-md border border-maroon-accent/50 bg-maroon-700/10 px-3.5 py-1.5 text-[13px] font-semibold text-maroon-accent hover:bg-maroon-accent/20 transition-colors"
              >
                {t(lang, { en: "Profile", fr: "Profil", ar: "الملف" })}
              </Link>
            ) : (
              <Link
                to="/profile"
                className="inline-flex items-center rounded-md bg-[image:var(--gradient-ember)] px-3.5 py-1.5 text-[13px] font-semibold text-paper shadow transition-opacity hover:opacity-95"
              >
                {t(lang, { en: "Sign In", fr: "Connexion", ar: "دخول" })}
              </Link>
            )}

            <a
              href="#involved"
              className="hidden rounded-sm border border-foreground px-[18px] py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors duration-300 hover:bg-foreground hover:text-paper lg:inline-block"
            >
              Partner with us
            </a>
          </div>

          <button aria-label="Menu" onClick={() => setOpen((v) => !v)} className="p-1.5 lg:hidden">
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
          <div className="mb-6 md:hidden">
            <MemberSearch />
          </div>
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
