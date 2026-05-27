"use client";

import BespokeImage from "../BespokeImage";
import BespokeQuoteWizard from "./BespokeQuoteWizard";

import {
  BESPOKE_FORM_IMAGE,
  BESPOKE_FORM_IMAGE_ALT,
  BESPOKE_FORM_SECTION,
} from "../content";

export default function BespokeQuoteFormSection() {
  return (
    <section
      id="quote-form"
      className="bespoke-page__section"
      aria-labelledby="bespoke-form-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          {BESPOKE_FORM_SECTION.eyebrow}
        </p>
        <h2 id="bespoke-form-title" className="bespoke-page__title" data-reveal>
          {BESPOKE_FORM_SECTION.title}
        </h2>
        <p className="bespoke-page__lead" data-reveal>
          {BESPOKE_FORM_SECTION.lead}
        </p>
        <div className="bespoke-form__layout" data-reveal>
          <div className="bespoke-form__visual bespoke-form__visual--wizard">
            <BespokeImage
              src={BESPOKE_FORM_IMAGE}
              alt={BESPOKE_FORM_IMAGE_ALT}
              fill
              sizes="(max-width:960px) 100vw, 40vw"
            />
          </div>
          <div className="bespoke-form__card bespoke-form__card--wizard">
            <BespokeQuoteWizard />
          </div>
        </div>
      </div>
    </section>
  );
}
