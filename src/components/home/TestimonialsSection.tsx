import Image from "next/image";

import data from "@/data/contactDatas.json";

const gold = "#D4AF37";

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={gold}
          className="shrink-0"
        >
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.9 1.18 6.88L12 17.77l-6.18 3.28L7 14.17 2 9.27l7.1-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const s = data.testimonialsSection;
  const r = s.rating;

  return (
    <section className="bg-[#1A1614] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-10 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 h-px w-10 bg-[#D4AF37] md:w-12" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
              {s.badge}
            </p>
            <h2 className="mt-4 font-serif text-3xl font-light leading-tight tracking-tight text-white md:text-4xl lg:text-[2.65rem]">
              {s.title}
            </h2>
          </div>

          <div className="flex shrink-0 flex-col gap-3 rounded-md border border-white/10 bg-[#262220] px-5 py-4 shadow-inner md:flex-row md:items-center md:gap-5 md:px-6 md:py-5">
            <StarRow count={r.starCount} />
            <div>
              <p className="text-lg font-medium tabular-nums text-white md:text-xl">
                {r.score}{" "}
                <span className="text-sm font-normal text-white/50">
                  / {r.outOf}
                </span>
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#A0A0A0]">
                {r.reviewsLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {s.items.map((item) => (
            <article
              key={item.author}
              className="flex flex-col border border-white/[0.06] bg-[#262220] p-6 md:p-8"
            >
              <span
                className="font-serif text-4xl leading-none text-[#D4AF37]/90"
                aria-hidden
              >
                &ldquo;
              </span>
              <blockquote className="mt-2 flex-1">
                <p className="font-serif text-base italic leading-relaxed text-white md:text-[17px]">
                  {item.quote}
                </p>
              </blockquote>

              <div className="my-6 h-px w-full bg-white/10" aria-hidden />

              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#1A1614]">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-base font-medium text-white">
                    {item.author}
                  </p>
                  <p className="mt-1 text-[10px] font-medium uppercase leading-snug tracking-[0.12em] text-[#A0A0A0]">
                    {item.tags.join(" • ")}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
 