"use client";

import BespokeImage from "../BespokeImage";
import { BESPOKE_FINAL_CTA } from "../content";

type Props = { onQuote: () => void };

export default function BespokeFinalCtaSection({ onQuote }: Props) {
  return (
    <section className="bespoke-final-cta" aria-labelledby="bespoke-final-cta-title">
      <div className="bespoke-final-cta__bg" aria-hidden>
        <BespokeImage src={BESPOKE_FINAL_CTA.image} alt="" fill sizes="100vw" />
      </div>
      <div className="bespoke-final-cta__overlay" aria-hidden />
      <div className="bespoke-page__container">
        <div className="bespoke-final-cta__content" data-reveal>
          <h2 id="bespoke-final-cta-title" className="bespoke-page__title">
            {BESPOKE_FINAL_CTA.headline}
          </h2>
          <p className="bespoke-page__lead">{BESPOKE_FINAL_CTA.subtext}</p>
          <button type="button" className="bespoke-page__btn" onClick={onQuote}>
            {BESPOKE_FINAL_CTA.cta}
          </button>
        </div>
      </div>
    </section>
  );
}
