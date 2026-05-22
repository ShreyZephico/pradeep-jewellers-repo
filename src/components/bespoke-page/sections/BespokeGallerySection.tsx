"use client";

import BespokeImage from "../BespokeImage";
import {
  BESPOKE_GALLERY_ROWS,
  BESPOKE_GALLERY_SECTION,
  type BespokeGalleryItem,
} from "../content";

const GALLERY_SIZE = 600;

function GalleryTile({ item }: { item: BespokeGalleryItem }) {
  return (
    <figure className="bespoke-gallery__tile">
      <div className="bespoke-gallery__img">
        <BespokeImage
          src={item.image}
          alt={item.alt}
          width={GALLERY_SIZE}
          height={GALLERY_SIZE}
          sizes="(max-width:768px) 28vw, 180px"
        />
      </div>
      <figcaption className="bespoke-gallery__label">
        <span>{item.title}</span>
      </figcaption>
    </figure>
  );
}

function GalleryRow({
  items,
  direction,
}: {
  items: readonly BespokeGalleryItem[];
  direction: "ltr" | "rtl";
}) {
  const rowClass =
    direction === "rtl"
      ? "bespoke-gallery__row bespoke-gallery__row--reverse"
      : "bespoke-gallery__row";

  return (
    <div className={rowClass}>
      <div className="bespoke-gallery__viewport">
        <div className="bespoke-gallery__track">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="bespoke-gallery__group"
              aria-hidden={copy === 1 ? true : undefined}
            >
              {items.map((item) => (
                <GalleryTile key={`${copy}-${item.id}`} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BespokeGallerySection() {
  const { eyebrow, title, lead, footnote } = BESPOKE_GALLERY_SECTION;

  return (
    <section
      id="craft"
      className="bespoke-page__section bespoke-gallery"
      aria-labelledby="bespoke-gallery-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          {eyebrow}
        </p>
        <h2 id="bespoke-gallery-title" className="bespoke-page__title" data-reveal>
          {title}
        </h2>
        <p className="bespoke-page__lead" data-reveal>
          {lead}
        </p>
      </div>

      <div className="bespoke-gallery__stage" data-reveal>
        {BESPOKE_GALLERY_ROWS.map((row) => (
          <GalleryRow key={row.id} items={row.items} direction={row.direction} />
        ))}
      </div>

      <div className="bespoke-page__container">
        <p className="bespoke-gallery__footnote" data-reveal>
          {footnote}
        </p>
      </div>
    </section>
  );
}
