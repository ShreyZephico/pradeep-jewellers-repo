"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import legalEn from "@/data/scheme/legal.en.json";
import legalGu from "@/data/scheme/legal.gu.json";
import siteEn from "@/data/scheme/site.en.json";
import siteGu from "@/data/scheme/site.gu.json";

const STORAGE_KEY = "svy_lang";

export type SchemeLang = "en" | "gu";

type SchemeContent = typeof siteEn & {
  legal: typeof legalEn;
};

type SchemeContentContextValue = {
  lang: SchemeLang;
  content: SchemeContent;
  setLanguage: (lang: SchemeLang) => void;
  toggleLanguage: () => void;
};

const SchemeContentContext = createContext<SchemeContentContextValue | null>(
  null
);

function getInitialLang(): SchemeLang {
  if (typeof window === "undefined") return "gu";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "gu";
}

export function SchemeContentProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<SchemeLang>(getInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<SchemeContentContextValue>(() => {
    const legal = lang === "gu" ? legalGu : legalEn;
    const content = {
      ...(lang === "gu" ? siteGu : siteEn),
      legal,
    } as SchemeContent;

    const setLanguage = (next: SchemeLang) => {
      setLang(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    };

    return {
      lang,
      content,
      setLanguage,
      toggleLanguage: () => setLanguage(lang === "gu" ? "en" : "gu"),
    };
  }, [lang]);

  return (
    <SchemeContentContext.Provider value={value}>
      {children}
    </SchemeContentContext.Provider>
  );
}

export function useSchemeContent() {
  const ctx = useContext(SchemeContentContext);
  if (!ctx) {
    throw new Error("useSchemeContent must be used within SchemeContentProvider");
  }
  return ctx;
}
