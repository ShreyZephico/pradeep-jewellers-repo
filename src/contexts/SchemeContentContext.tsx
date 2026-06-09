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
import {
  parseSchemeLang,
  schemeLangCookieHeader,
  SCHEME_LANG_DEFAULT,
  SCHEME_LANG_STORAGE_KEY,
  type SchemeLang,
} from "@/lib/scheme/schemeLang";

export type { SchemeLang };

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

function persistSchemeLang(next: SchemeLang) {
  try {
    window.localStorage.setItem(SCHEME_LANG_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  document.cookie = schemeLangCookieHeader(next);
}

export function SchemeContentProvider({
  children,
  initialLang = SCHEME_LANG_DEFAULT,
}: {
  children: ReactNode;
  initialLang?: SchemeLang;
}) {
  const [lang, setLang] = useState<SchemeLang>(initialLang);

  useEffect(() => {
    try {
      const fromStorage = parseSchemeLang(
        window.localStorage.getItem(SCHEME_LANG_STORAGE_KEY)
      );
      if (fromStorage) {
        if (fromStorage !== initialLang) {
          setLang(fromStorage);
        }
        document.cookie = schemeLangCookieHeader(fromStorage);
        return;
      }
    } catch {
      /* ignore */
    }

    persistSchemeLang(initialLang);
  }, [initialLang]);

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
      persistSchemeLang(next);
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
