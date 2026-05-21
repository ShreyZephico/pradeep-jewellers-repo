"use client";

import { START_DESIGN_STEPS } from "./content";

export default function StartDesignStepsSection() {
  return (
    <>
      <div className="start-design-section__head">
        <div>
          <h2 id="start-design-steps-title" className="start-design-section__title">
            How it works
          </h2>
          <p className="start-design-section__hint">
            Four simple steps — from reference to ready-to-wear.
          </p>
        </div>
      </div>

      <div className="start-design-steps__grid">
        {START_DESIGN_STEPS.map((s, idx) => (
          <div key={s.title} className="start-design-card start-design-step">
            <div className="start-design-step__num">
              {String(idx + 1).padStart(2, "0")}
            </div>
            <div className="start-design-step__body">
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

