"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import data from "@/data/contactDatas.json";
import { normalizeIndianMobile } from "@/utils/indianPhone";

import "./css/social.css";

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="social-section__icon-link"
    >
      {children}
    </Link>
  );
}

export default function SocialSection() {
  const s = data.socialSection;
  const social = data.social;
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instaUrl = social.instagram;

  const waBase = useMemo(() => {
    const m = social.whatsapp.match(/wa\.me\/(\d+)/);
    return m ? m[1] : "919876543210";
  }, [social.whatsapp]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reveal = () => setVisible(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal();
    }

    return () => observer.disconnect();
  }, []);

  async function handleBroadcast(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError(s.broadcast.errors.phoneRequired);
      return;
    }

    const national = normalizeIndianMobile(phone);
    if (!national) {
      setError(s.broadcast.errors.phoneInvalid);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/social-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(payload.error ?? s.broadcast.errors.submitFailed);
        return;
      }

      const msg = s.broadcast.whatsappMessageTemplate.replace("{phone}", national);
      window.location.href = `https://wa.me/${waBase}?text=${encodeURIComponent(msg)}`;
    } catch {
      setError(s.broadcast.errors.submitFailed);
    } finally {
      setLoading(false);
    }
  }

  const sectionClass = `social-section${
    visible ? " social-section--visible" : ""
  }`;

  return (
    <section
      ref={sectionRef}
      className={sectionClass}
      aria-labelledby="social-section-heading"
    >
      <div className="social-section__inner">
        <div className="social-section__layout">
          <div className="social-section__content">
            <div className="social-section__handle-row">
              <span className="social-section__handle-line" aria-hidden />
              <p className="social-section__handle">{s.handle}</p>
            </div>

            <h2 id="social-section-heading" className="social-section__title">
              {s.title}
            </h2>
            <p className="social-section__description">{s.description}</p>

            <div className="social-section__icons">
              <SocialIconLink href={social.instagram} label="Instagram">
                <InstagramGlyph className="social-section__icon-svg" />
              </SocialIconLink>
              <SocialIconLink href={social.facebook} label="Facebook">
                <svg
                  className="social-section__icon-svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M22 12a10 10 0 1 0-11.5 9.95v-7.03H7.9V12h2.65V9.41c0-2.62 1.56-4.06 3.94-4.06 1.14 0 2.33.2 2.33.2v2.56h-1.31c-1.3 0-1.7.8-1.7 1.63V12h2.89l-.46 2.92h-2.43v7.03A10 10 0 0 0 22 12Z" />
                </svg>
              </SocialIconLink>
              <SocialIconLink href={social.youtube} label="YouTube">
                <svg
                  className="social-section__icon-svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M23.5 7.2s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1C17.1 3.5 12 3.5 12 3.5h-.01S6.9 3.5 3.8 3.44c-.46.05-1.46.06-2.36 1C.73 5.56.5 7.2.5 7.2S.16 9.05.16 10.9v1.78c0 1.85.34 3.7.34 3.7s.23 1.64.94 2.36c.9.94 2.08.91 2.61 1 1.9.18 8.09.21 8.09.21s5.11-.01 8.22-.27c.46-.05 1.46-.06 2.36-1 .71-.72.94-2.36.94-2.36s.34-1.85.34-3.7V10.9c0-1.85-.34-3.7-.34-3.7ZM9.75 14.25v-5.5L15.5 11.5l-5.75 2.75Z" />
                </svg>
              </SocialIconLink>
            </div>

            <div className="social-section__broadcast">
              <div className="social-section__broadcast-header">
                <span className="social-section__broadcast-icon">
                  <WhatsAppGlyph />
                </span>
                <div>
                  <p className="social-section__broadcast-title">
                    {s.broadcast.title}
                  </p>
                  <p className="social-section__broadcast-subtitle">
                    {s.broadcast.subtitle}
                  </p>
                </div>
              </div>
              <form className="social-section__form" onSubmit={handleBroadcast}>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  suppressHydrationWarning
                  autoComplete="tel"
                  placeholder={s.broadcast.inputPlaceholder}
                  className={`social-section__input${
                    error ? " social-section__input--error" : ""
                  }`}
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    if (error) setError(null);
                  }}
                  maxLength={14}
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                />
                <button
                  type="submit"
                  suppressHydrationWarning
                  className="social-section__submit"
                  disabled={loading}
                >
                  {loading ? s.broadcast.submittingText : s.broadcast.buttonText}
                </button>
              </form>
              {error ? (
                <p className="social-section__form-error" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="social-section__grid">
            {s.gridImages.map((img, index) => {
              const href =
                "href" in img && typeof img.href === "string"
                  ? img.href
                  : instaUrl;
              return (
                <Link
                  key={img.src}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-section__grid-item"
                  style={{ "--card-index": index } as CSSProperties}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="social-section__grid-image"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                  />
                  <span className="social-section__grid-overlay" aria-hidden>
                    <InstagramGlyph className="social-section__grid-overlay-icon" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
