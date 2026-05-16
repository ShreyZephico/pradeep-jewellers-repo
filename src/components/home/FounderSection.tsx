import Image from "next/image";
import Link from "next/link";

import data from "@/data/contactDatas.json";

export default function FounderSection() {
  const s = data.founderSection;

  return (
    <section className="bg-[#FCF9F5] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          {/* Image + overlay */}
          <div className="relative mx-auto w-full max-w-md pb-14 sm:pb-16 lg:mx-0 lg:max-w-none lg:pb-0">
            <div className="relative aspect-[4/5] w-full overflow-hidden shadow-[0_28px_60px_rgba(0,0,0,0.12)]">
              <Image
                src={s.image}
                alt={s.imageAlt}
                fill
                className="object-cover object-center [filter:sepia(0.12)_saturate(0.92)]"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={false}
              />
            </div>
            <div className="absolute -bottom-5 right-0 z-10 w-[min(100%,13.5rem)] bg-[#B08D44] px-6 py-5 shadow-lg md:-bottom-6 md:right-4 md:w-56 lg:right-0">
              <p className="font-serif text-4xl font-light leading-none text-white md:text-[2.75rem]">
                {s.establishedYear}
              </p>
              <p className="mt-3 text-[10px] font-semibold uppercase leading-snug tracking-[0.2em] text-white/95">
                {s.establishedText}
              </p>
            </div>
          </div>

          {/* Copy */}
          <div className="pt-6 lg:pt-0">
            <div className="mb-6 flex items-center gap-4">
              <span
                className="h-px w-10 shrink-0 bg-[#B08D44] md:w-12"
                aria-hidden
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B08D44]">
                {s.sectionLabel}
              </p>
            </div>

            <h2 className="max-w-xl font-serif text-3xl font-light leading-tight tracking-tight text-[#333333] md:text-4xl lg:text-[2.65rem]">
              {s.heading}
            </h2>

            <div className="relative mt-8 max-w-xl pl-1">
              <span
                className="absolute -left-1 top-0 font-serif text-5xl leading-none text-[#B08D44]/90 md:text-6xl"
                aria-hidden
              >
                &ldquo;
              </span>
              <blockquote className="border-l-2 border-[#B08D44] pl-6 pt-8 md:pl-8 md:pt-10">
                <p className="font-serif text-lg italic leading-relaxed text-[#333333]/85 md:text-xl">
                  {s.quote}
                </p>
              </blockquote>
            </div>

            <p className="mt-8 max-w-xl text-sm leading-relaxed text-[#333333]/75 md:text-base">
              {s.description}
            </p>

            <Link
              href={s.linkHref}
              className="mt-10 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B08D44] transition hover:gap-3"
            >
              {s.linkText}
              <span className="text-sm leading-none" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
