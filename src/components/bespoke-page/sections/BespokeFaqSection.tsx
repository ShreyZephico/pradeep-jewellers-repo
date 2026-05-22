"use client";

import { useState } from "react";

import { BESPOKE_FAQ, BESPOKE_FAQ_SECTION } from "../content";

export default function BespokeFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      className="bespoke-page__section"
      aria-labelledby="bespoke-faq-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          {BESPOKE_FAQ_SECTION.eyebrow}
        </p>
        <h2 id="bespoke-faq-title" className="bespoke-page__title" data-reveal>
          {BESPOKE_FAQ_SECTION.title}
        </h2>
        <div className="bespoke-faq__list" data-reveal>
          {BESPOKE_FAQ.map((item, i) => {
            const open = openIndex === i;
            return (
              <div
                key={item.q}
                className={`bespoke-faq__item${open ? " is-open" : ""}`}
              >
                <button
                  type="button"
                  className="bespoke-faq__trigger"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  {item.q}
                  <span className="bespoke-faq__icon" aria-hidden>
                    +
                  </span>
                </button>
                <div className="bespoke-faq__answer">
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
