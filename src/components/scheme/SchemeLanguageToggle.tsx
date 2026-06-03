"use client";

import { MaterialIcon } from "@/components/scheme/shared";
import type { SchemeLang } from "@/contexts/SchemeContentContext";
import type { SchemeTopNav } from "@/lib/scheme/contentTypes";

export default function SchemeLanguageToggle({
  toggle,
  currentLang,
  onSelectLanguage,
}: {
  toggle: SchemeTopNav["languageToggle"];
  currentLang: SchemeLang;
  onSelectLanguage: (lang: SchemeLang) => void;
}) {
  if (!toggle) return null;

  return (
    <div className="svy__langWrap">
      <MaterialIcon name="translate" className="svy__langIcon" aria-hidden />
      <div
        className="svy__langSwitch"
        role="group"
        aria-label={toggle.groupAriaLabel}
      >
        <span className="svy__langSwitchHint">{toggle.switchHint}</span>
        <div className="svy__langSwitchTrack">
          <button
            type="button"
            className={[
              "svy__langSwitchBtn",
              currentLang === "en" ? "is-active" : null,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelectLanguage("en")}
            aria-pressed={currentLang === "en"}
            aria-label={toggle.englishAria}
          >
            {toggle.englishShort}
          </button>
          <button
            type="button"
            className={[
              "svy__langSwitchBtn",
              currentLang === "gu" ? "is-active" : null,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelectLanguage("gu")}
            aria-pressed={currentLang === "gu"}
            aria-label={toggle.gujaratiAria}
          >
            {toggle.gujaratiShort}
          </button>
        </div>
      </div>
    </div>
  );
}
