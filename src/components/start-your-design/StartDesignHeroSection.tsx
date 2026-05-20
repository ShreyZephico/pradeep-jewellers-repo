"use client";

import Link from "next/link";
import { useMemo } from "react";

import data from "@/data/contactDatas.json";

import { START_DESIGN_CATEGORIES } from "./content";

type Props = {
  categoryId: string;
  setCategoryId: (id: string) => void;
  onScrollToForm: () => void;
};

function getWhatsAppNumber(): string {
  const wa = data.social.whatsapp;
  const m = wa.match(/wa\.me\/(\d+)/);
  return m ? m[1] : "919265075114";
}

export default function StartDesignHeroSection({
  categoryId,
  setCategoryId,
  onScrollToForm,
}: Props) {
  const waNumber = useMemo(() => getWhatsAppNumber(), []);

  return (
    <div className="start-design-hero__grid">
      <div>
        <span className="start-design-hero__badge">BESPOKE QUOTATION • AHMEDABAD</span>
        <h1 id="start-design-hero-title" className="start-design-hero__title">
          Start your <span className="start-design-hero__title-accent">design</span>
        </h1>
        <p className="start-design-hero__sub">
          Share your reference and requirements. We’ll send an estimate on WhatsApp
          with a clear breakdown and timeline.
        </p>

        <div className="start-design-hero__actions">
          <button
            type="button"
            className="start-design-btn start-design-btn--primary"
            onClick={onScrollToForm}
          >
            Get quotation <span aria-hidden>→</span>
          </button>
          <Link
            className="start-design-btn start-design-btn--secondary"
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp consult
          </Link>
        </div>

        <div className="start-design-hero__chips" aria-label="Trust badges">
          <span className="start-design-hero__chip">BIS hallmarked</span>
          <span className="start-design-hero__chip">Since 1972</span>
          <span className="start-design-hero__chip">Transparent estimate</span>
        </div>
      </div>

      <div className="start-design-card start-design-hero__prefill">
        <p className="start-design-hero__prefill-title">Quick prefill</p>
        <p className="start-design-hero__prefill-sub">
          Choose what you want to make — we’ll format a clean quote request.
        </p>

        <div className="start-design-cats__grid start-design-hero__prefill-grid">
          {START_DESIGN_CATEGORIES.slice(0, 4).map((c) => (
            <button
              key={c.id}
              type="button"
              className={[
                "start-design-card",
                "start-design-cat",
                categoryId === c.id ? "start-design-cat--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setCategoryId(c.id)}
            >
              <p className="start-design-cat__label">{c.label}</p>
              <p className="start-design-cat__desc">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

