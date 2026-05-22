"use client";

import Image from "next/image";

import {
  BESPOKE_CATEGORIES,
  type BespokeCategoryId,
} from "../content";

type Props = {
  activeId: BespokeCategoryId;
  onSelect: (id: BespokeCategoryId) => void;
  onCustomize: () => void;
};

export default function BespokeDesignOptionsSection({
  activeId,
  onSelect,
  onCustomize,
}: Props) {
  return (
    <section
      className="bespoke-page__section"
      aria-labelledby="bespoke-cats-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          Design options
        </p>
        <h2 id="bespoke-cats-title" className="bespoke-page__title" data-reveal>
          Choose your category
        </h2>
        <p className="bespoke-page__lead" data-reveal>
          Select a starting point — we tailor metal, stones, and finish to your vision.
        </p>
        <div className="bespoke-cats__grid">
          {BESPOKE_CATEGORIES.map((cat, i) => (
            <button
              key={cat.id}
              type="button"
              className={`bespoke-cats__card${activeId === cat.id ? " is-active" : ""}`}
              data-reveal
              data-stagger={String((i % 3) + 1)}
              onClick={() => {
                onSelect(cat.id);
                onCustomize();
              }}
            >
              <div className="bespoke-cats__img">
                <Image src={cat.image} alt={cat.imageAlt} fill sizes="(max-width:768px) 100vw, 33vw" />
              </div>
              <div className="bespoke-cats__body">
                <h3>{cat.label}</h3>
                <p className="bespoke-cats__price">{cat.priceFrom}</p>
                <span className="bespoke-cats__cta">Customize This →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
