import Link from "next/link";

import data from "@/data/contactDatas.json";

const accent = "#C5A07A";

function ArticleIcon({ name }: { name: string }) {
  const box = "h-10 w-10 shrink-0 rounded-sm border border-[#C5A07A]/25 bg-[#C5A07A]/10 p-2";
  const stroke = "text-[#C5A07A]";
  switch (name) {
    case "gem":
      return (
        <div className={box} aria-hidden>
          <svg className={stroke} viewBox="0 0 24 24" fill="none" width="100%" height="100%">
            <path
              d="M12 2l2.5 4h5L12 22 4.5 6h5L12 2Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M6 6h12M9.5 6 12 2l2.5 4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    case "diamond":
      return (
        <div className={box} aria-hidden>
          <svg className={stroke} viewBox="0 0 24 24" fill="none" width="100%" height="100%">
            <path
              d="M12 3 4 9l8 12 8-12-8-6Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M8 9h8M12 3v18" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>
      );
    case "ruler":
      return (
        <div className={box} aria-hidden>
          <svg className={stroke} viewBox="0 0 24 24" fill="none" width="100%" height="100%">
            <path
              d="M4 16 16 4l4 4-12 12-4-4Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M9 11h2M11 9v2M13 7h2M15 5v2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    case "sparkles":
      return (
        <div className={box} aria-hidden>
          <svg className={stroke} viewBox="0 0 24 24" fill="none" width="100%" height="100%">
            <path
              d="M12 3v3M12 18v3M3 12h3M18 12h3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          </svg>
        </div>
      );
    default:
      return <div className={box} aria-hidden />;
  }
}

export default function LearnSection() {
  const s = data.learnSection;

  return (
    <section className="bg-[#FAF9F6] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span
              className="h-px w-10 shrink-0 md:w-14"
              style={{ backgroundColor: accent }}
              aria-hidden
            />
            <p
              className="text-[11px] font-medium uppercase tracking-[0.32em]"
              style={{ color: accent }}
            >
              {s.badge}
            </p>
            <span
              className="h-px w-10 shrink-0 md:w-14"
              style={{ backgroundColor: accent }}
              aria-hidden
            />
          </div>
          <h2 className="font-serif text-3xl font-light leading-tight tracking-tight text-[#2D2D2D] md:text-4xl lg:text-[2.65rem]">
            {s.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {s.articles.map((article) => (
            <Link
              key={article.href}
              href={article.href}
              className="group flex h-full flex-col border border-neutral-200/80 bg-white p-6 shadow-[0_2px_24px_rgba(45,45,45,0.04)] transition hover:border-[#C5A07A]/35 hover:shadow-[0_12px_40px_rgba(45,45,45,0.08)]"
            >
              <ArticleIcon name={article.icon} />
              <p
                className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: accent }}
              >
                {article.category}
              </p>
              <h3 className="mt-3 font-serif text-lg font-normal leading-snug text-[#2D2D2D] transition group-hover:opacity-90 md:text-xl">
                {article.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#2D2D2D]/60">
                {article.summary}
              </p>
              <div className="mt-6 flex items-end justify-between gap-3 border-t border-neutral-100 pt-5">
                <span className="text-xs text-[#2D2D2D]/45">
                  {s.readPrefix} {article.readTime}
                </span>
                <span
                  className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition group-hover:gap-2"
                  style={{ color: accent }}
                >
                  <span>{s.learnMoreLabel}</span>
                  <span aria-hidden className="text-base leading-none">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
