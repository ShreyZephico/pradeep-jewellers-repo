import BespokeImage from "../BespokeImage";
import { BESPOKE_PROCESS, BESPOKE_PROCESS_SECTION } from "../content";

export default function BespokeProcessSection() {
  return (
    <section
      className="bespoke-page__section"
      aria-labelledby="bespoke-process-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          {BESPOKE_PROCESS_SECTION.eyebrow}
        </p>
        <h2 id="bespoke-process-title" className="bespoke-page__title" data-reveal>
          {BESPOKE_PROCESS_SECTION.title}
        </h2>
        <p className="bespoke-page__lead" data-reveal>
          {BESPOKE_PROCESS_SECTION.lead}
        </p>
        <div className="bespoke-process__grid">
          {BESPOKE_PROCESS.map((step, i) => (
            <article
              key={step.step}
              className="bespoke-process__card"
              data-reveal
              data-stagger={String((i % 4) + 1)}
            >
              <div className="bespoke-process__thumb">
                <BespokeImage
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  sizes="120px"
                />
              </div>
              <span className="bespoke-process__step">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
