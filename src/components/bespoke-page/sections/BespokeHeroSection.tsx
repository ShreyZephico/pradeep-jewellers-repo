"use client";

import BespokeImage from "../BespokeImage";
import { BESPOKE_HERO } from "../content";

type Props = { onStart: () => void };

export default function BespokeHeroSection({ onStart }: Props) {
  return (
    <section className="bespoke-hero" aria-labelledby="bespoke-hero-title">
      <div className="bespoke-hero__media" aria-hidden>
        <BespokeImage
          src={BESPOKE_HERO.image}
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="bespoke-hero__overlay" aria-hidden />
      <div className="bespoke-page__container">
        <div className="bespoke-hero__content" data-reveal>
          <h1 id="bespoke-hero-title" className="bespoke-hero__title">
            {BESPOKE_HERO.headline}
          </h1>
          <p className="bespoke-hero__sub">{BESPOKE_HERO.subheadline}</p>
          <div className="bespoke-hero__actions">
            <button type="button" className="bespoke-page__btn" onClick={onStart}>
              {BESPOKE_HERO.cta}
            </button>
            <a
              href={BESPOKE_HERO.secondaryCtaHref}
              className="bespoke-page__btn bespoke-page__btn--outline"
            >
              {BESPOKE_HERO.secondaryCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
