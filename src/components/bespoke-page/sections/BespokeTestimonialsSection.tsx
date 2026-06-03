import Image from "next/image";

import { PLACEHOLDER_AVATAR } from "@/lib/placeholderImages";

import { BESPOKE_TESTIMONIALS } from "../content";

export default function BespokeTestimonialsSection() {
  return (
    <section
      className="bespoke-page__section bespoke-page__section--dark"
      aria-labelledby="bespoke-testimonials-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          Testimonials
        </p>
        <h2 id="bespoke-testimonials-title" className="bespoke-page__title" data-reveal>
          Loved by our clients
        </h2>
        <div className="bespoke-testimonials__grid">
          {BESPOKE_TESTIMONIALS.map((t, i) => (
            <blockquote
              key={t.name}
              className="bespoke-testimonials__card"
              data-reveal
              data-stagger={String((i % 2) + 1)}
            >
              <div className="bespoke-testimonials__stars" aria-label={`${t.rating} stars`}>
                {"★".repeat(t.rating)}
              </div>
              <p>{t.text}</p>
              <footer className="bespoke-testimonials__head">
                <div className="bespoke-testimonials__avatar">
                  <Image
                    src={t.image || PLACEHOLDER_AVATAR}
                    alt=""
                    fill
                    sizes="48px"
                    unoptimized={(t.image || PLACEHOLDER_AVATAR).endsWith(
                      ".svg"
                    )}
                  />
                </div>
                <p className="bespoke-testimonials__name">{t.name}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
