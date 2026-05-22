import { BESPOKE_WHY_US } from "../content";

export default function BespokeWhyUsSection() {
  return (
    <section
      className="bespoke-page__section bespoke-page__section--dark"
      aria-labelledby="bespoke-why-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          Why choose us
        </p>
        <h2 id="bespoke-why-title" className="bespoke-page__title" data-reveal>
          Craft you can trust
        </h2>
        <div className="bespoke-why__grid">
          {BESPOKE_WHY_US.map((item, i) => (
            <div
              key={item.title}
              className="bespoke-why__item"
              data-reveal
              data-stagger={String((i % 3) + 1)}
            >
              <div className="bespoke-why__icon" aria-hidden>
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
