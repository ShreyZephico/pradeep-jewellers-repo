import Image from "next/image";
import Link from "next/link";

import data from "@/data/contactDatas.json";

export default function BespokeSection() {
  const s = data.bespokeSection;

  return (
    <section className="relative isolate flex min-h-[min(100svh,52rem)] items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={s.backgroundImage}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-[#0a0806]/75 backdrop-blur-[2px]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/55"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-24 text-center md:py-32 lg:py-36">
        <div className="mb-8 flex items-center justify-center gap-4 md:mb-10">
          <span
            className="h-px w-10 shrink-0 bg-[#B88E4F] md:w-14"
            aria-hidden
          />
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#B88E4F]">
            {s.subtitle}
          </p>
          <span
            className="h-px w-10 shrink-0 bg-[#B88E4F] md:w-14"
            aria-hidden
          />
        </div>

        <h2 className="font-serif text-4xl font-light leading-[1.15] tracking-tight text-white md:text-5xl lg:text-6xl">
          {s.titleLine1}
          <br />
          <span className="text-[#B88E4F] italic">{s.titleLine2}</span>
        </h2>

        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
          {s.description}
        </p>

        <div className="mt-12 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:mt-14">
          <Link
            href={s.ctaPrimary.link}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 bg-[#B88E4F] px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#c49a56]"
          >
            {s.ctaPrimary.text}
            <span aria-hidden className="text-sm">
              →
            </span>
          </Link>

          <a
            href={s.ctaSecondary.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 border border-white/90 bg-transparent px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0 text-white"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {s.ctaSecondary.text}
          </a>

          <Link
            href={s.ctaTertiary.link}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:text-[#B88E4F]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden>
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
                <path
                  d="M10 8.5v7l5.5-3.5L10 8.5Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            {s.ctaTertiary.text}
          </Link>
        </div>
      </div>
    </section>
  );
}
