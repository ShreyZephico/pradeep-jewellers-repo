"use client";

import { useState } from "react";
import Image from "next/image";

import {
  BESPOKE_GEMSTONES,
  BESPOKE_METALS,
  BESPOKE_STYLES,
} from "../content";

const TABS = ["Metal", "Gemstones", "Design style"] as const;

export default function BespokeCustomizationSection() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Metal");

  return (
    <section
      className="bespoke-page__section bespoke-page__section--dark"
      aria-labelledby="bespoke-custom-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          Customization
        </p>
        <h2 id="bespoke-custom-title" className="bespoke-page__title" data-reveal>
          What&apos;s possible
        </h2>
        <p className="bespoke-page__lead" data-reveal>
          Premium metals, certified gemstones, and styles from traditional to contemporary.
        </p>
        <div data-reveal>
          <div className="bespoke-custom__tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`bespoke-custom__tab${tab === t ? " is-active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="bespoke-custom__panel" role="tabpanel">
            {tab === "Metal" && (
              <div className="bespoke-custom__chips">
                {BESPOKE_METALS.map((m) => (
                  <span key={m} className="bespoke-custom__chip">
                    {m}
                  </span>
                ))}
              </div>
            )}
            {tab === "Gemstones" && (
              <div className="bespoke-custom__chips">
                {BESPOKE_GEMSTONES.map((g) => (
                  <span key={g} className="bespoke-custom__chip">
                    {g}
                  </span>
                ))}
              </div>
            )}
            {tab === "Design style" && (
              <div className="bespoke-custom__styles">
                {BESPOKE_STYLES.map((s) => (
                  <div key={s.label} className="bespoke-custom__style-card">
                    <div className="bespoke-custom__style-img">
                      <Image src={s.image} alt={s.label} fill sizes="160px" />
                    </div>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
