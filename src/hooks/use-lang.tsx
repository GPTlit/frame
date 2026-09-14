import { useCallback, useEffect, useState } from "react";

export type Lang = "en" | "fr" | "ar";

const KEY = "frame-lang";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "ar", label: "AR" },
];

export function useLang() {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(KEY) as Lang | null;
    if (stored === "en" || stored === "fr" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-lang", lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem(KEY, next);
    setLangState(next);
  }, []);

  return { lang, setLang };
}

/** Pick the copy for the active language, falling back to English. */
export function t(lang: Lang, copy: { en: string; fr?: string; ar?: string }) {
  return copy[lang] ?? copy.en;
}
