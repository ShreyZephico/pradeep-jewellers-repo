"use client";

import { START_DESIGN_CATEGORIES } from "./content";

type Props = {
  categoryId: string;
  setCategoryId: (id: string) => void;
};

export default function StartDesignCategoriesSection({
  categoryId,
  setCategoryId,
}: Props) {
  return (
    <>
      <div className="start-design-section__head">
        <div>
          <h2 id="start-design-cats-title" className="start-design-section__title">
            What are you designing?
          </h2>
          <p className="start-design-section__hint">
            Pick a category to prefill your request.
          </p>
        </div>
      </div>

      <div className="start-design-cats__grid">
        {START_DESIGN_CATEGORIES.map((c) => (
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
    </>
  );
}

