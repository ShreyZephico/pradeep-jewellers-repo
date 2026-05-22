export default function LearnArticleIcon({ name }: { name: string }) {
  const wrapClass = "learn-article-icon";
  const svgClass = "learn-article-icon__svg";

  switch (name) {
    case "gem":
      return (
        <div className={wrapClass} aria-hidden>
          <svg className={svgClass} viewBox="0 0 24 24" fill="none">
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
        <div className={wrapClass} aria-hidden>
          <svg className={svgClass} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3 4 9l8 12 8-12-8-6Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M8 9h8M12 3v18"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      );
    case "ruler":
      return (
        <div className={wrapClass} aria-hidden>
          <svg className={svgClass} viewBox="0 0 24 24" fill="none">
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
        <div className={wrapClass} aria-hidden>
          <svg className={svgClass} viewBox="0 0 24 24" fill="none">
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
      return <div className={wrapClass} aria-hidden />;
  }
}
