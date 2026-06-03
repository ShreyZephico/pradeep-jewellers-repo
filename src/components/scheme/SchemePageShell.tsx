"use client";

import type { ReactNode } from "react";

import SchemeLanguageToggle from "@/components/scheme/SchemeLanguageToggle";
import { useSchemeContent } from "@/contexts/SchemeContentContext";

/** Scheme content area; site Header/Footer come from the root layout. */
export default function SchemePageShell({ children }: { children: ReactNode }) {
  const { lang, content, setLanguage } = useSchemeContent();

  return (
    <div className="svy">
      <main className="svy__main">
        <div className="svy__pageToolbar">
          <SchemeLanguageToggle
            toggle={content.topNav.languageToggle}
            currentLang={lang}
            onSelectLanguage={setLanguage}
          />
        </div>
        {children}
      </main>
    </div>
  );
}
