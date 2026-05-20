"use client";

import { START_DESIGN_FAQ } from "./content";

export default function StartDesignFaqSection() {
  return (
    <>
      <div className="start-design-section__head">
        <div>
          <h2 id="start-design-faq-title" className="start-design-section__title">
            FAQ
          </h2>
          <p className="start-design-section__hint">Quick answers before you submit.</p>
        </div>
      </div>

      <div className="start-design-faq__list">
        {START_DESIGN_FAQ.map((item) => (
          <div key={item.q} className="start-design-card start-design-faq__item">
            <p className="start-design-faq__q">{item.q}</p>
            <p className="start-design-faq__a">{item.a}</p>
          </div>
        ))}
      </div>
    </>
  );
}

