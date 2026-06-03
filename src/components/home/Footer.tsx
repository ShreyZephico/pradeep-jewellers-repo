"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import data from "@/data/contactDatas.json";
import { useGoldRates } from "@/contexts/GoldRatesContext";
import { formatInr } from "@/lib/goldRates";
import type { GoldRateApiResponse } from "@/types/goldRate";
import { getImageUrl } from "@/utils/cloudinary";

import "./css/footer.css";

type LiveRates = NonNullable<GoldRateApiResponse["data"]>;
type RateTickerKey = keyof Pick<LiveRates, "gold22k" | "silver1kg">;

type TickerItem = {
  key: string;
  label: string;
  price: string;
  unitSuffix: string;
};

function buildFooterTickerItems(
  ratesConfig: (typeof data.heroSection)["rates"],
  live: LiveRates | undefined
): TickerItem[] {
  const entries: { key: RateTickerKey; config: (typeof ratesConfig)["gold22k"] }[] =
    [];

  if (ratesConfig?.gold22k) {
    entries.push({ key: "gold22k", config: ratesConfig.gold22k });
  }
  if (ratesConfig?.silver1kg) {
    entries.push({ key: "silver1kg", config: ratesConfig.silver1kg });
  }

  return entries.map(({ key, config }) => ({
    key,
    label: config.label,
    price: live?.[key] ? formatInr(live[key].current) : "—",
    unitSuffix: config.unitSuffix?.trim() ?? "",
  }));
}

function DiamondSep() {
  return (
    <span className="site-footer__ticker-sep" aria-hidden>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 4 9l8 13 8-13-8-7Z" />
      </svg>
    </span>
  );
}

function FooterRatesTicker({ items }: { items: TickerItem[] }) {
  const row = (
    <>
      {items.map((item, i) => (
        <Fragment key={item.key}>
          {i > 0 ? <DiamondSep /> : null}
          <span className="site-footer__ticker-item">
            <span className="site-footer__ticker-label">{item.label}</span>
            <span className="site-footer__ticker-price">{item.price}</span>
            {item.unitSuffix ? (
              <span className="site-footer__ticker-unit">{item.unitSuffix}</span>
            ) : null}
          </span>
        </Fragment>
      ))}
    </>
  );

  return (
    <div
      className="site-footer__ticker"
      role="region"
      aria-label="Live gold and silver rates"
    >
      <div className="site-footer__ticker-viewport">
        <div className="site-footer__ticker-track" aria-live="polite">
          <div className="site-footer__ticker-group">{row}</div>
          <div className="site-footer__ticker-group" aria-hidden>
            {row}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6.6 3.2c.4-.1.9.1 1.1.5l1.4 2.8c.2.4.1.9-.2 1.2l-1.1 1.1a12 12 0 0 0 5.5 5.5l1.1-1.1c.3-.3.8-.4 1.2-.2l2.8 1.4c.4.2.6.7.5 1.1l-.5 2.4c-.1.5-.6.9-1.1 1a16 16 0 0 1-14-14c0-.5.4-1 1-1.1l2.4-.5Z" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" strokeLinecap="round" />
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
      className="site-footer__social-link"
    >
      {children}
    </Link>
  );
}

export default function Footer() {
  const f = data.footerSection;
  const brand = data.brand;
  const contact = data.contact;
  const social = data.social;
  const ratesConfig = data.heroSection.rates;
  const { payload } = useGoldRates();
  const live = payload?.data;

  const footerRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const year = new Date().getFullYear();

  const tickerItems = buildFooterTickerItems(ratesConfig, live);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const reveal = () => setVisible(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );

    observer.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal();
    }

    return () => observer.disconnect();
  }, []);

  function onNewsletter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) return;
    const subject = encodeURIComponent(f.newsletter.mailtoSubject);
    const body = encodeURIComponent(
      `Please add this email to the newsletter list: ${email}`
    );
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
  }

  const footerClass = `site-footer${visible ? " site-footer--visible" : ""}`;

  return (
    <footer ref={footerRef} className={footerClass}>
      <FooterRatesTicker items={tickerItems} />

      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Link href="/" className="site-footer__brand-link">
              {!logoError ? (
                <span className="site-footer__logo-wrap">
                  <Image
                    src={getImageUrl(brand.logo)}
                    alt=""
                    width={48}
                    height={48}
                    className="site-footer__logo-img"
                    onError={() => setLogoError(true)}
                  />
                </span>
              ) : (
                <span className="site-footer__logo-fallback">
                  {brand.name.charAt(0)}
                </span>
              )}
              <span className="site-footer__brand-name">{brand.name}</span>
            </Link>
            <p className="site-footer__description">{f.brandDescription}</p>
            <p className="site-footer__compliance">{f.complianceLine}</p>

            <form className="site-footer__newsletter" onSubmit={onNewsletter}>
              <input
                name="email"
                type="email"
                required
                suppressHydrationWarning
                autoComplete="email"
                placeholder={f.newsletter.placeholder}
                className="site-footer__newsletter-input"
              />
              <button
                type="submit"
                suppressHydrationWarning
                className="site-footer__newsletter-btn"
                aria-label="Subscribe to newsletter"
              >
                →
              </button>
            </form>
          </div>

          <div
            className="site-footer__column"
            style={{ "--col-index": 1 } as CSSProperties}
          >
            <h3 className="site-footer__heading">Shop</h3>
            <ul className="site-footer__links">
              {f.shopLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="site-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="site-footer__column"
            style={{ "--col-index": 2 } as CSSProperties}
          >
            <h3 className="site-footer__heading">Discover</h3>
            <ul className="site-footer__links">
              {f.discoverLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="site-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="site-footer__column"
            style={{ "--col-index": 3 } as CSSProperties}
          >
            <h3 className="site-footer__heading">Visit us</h3>
            <ul className="site-footer__visit-list">
              <li className="site-footer__visit-item">
                <IconPin className="site-footer__visit-icon" />
                <span>{f.visit.address}</span>
              </li>
              <li className="site-footer__visit-item">
                <IconPhone className="site-footer__visit-icon" />
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="site-footer__link"
                >
                  {contact.phone}
                </a>
              </li>
              <li className="site-footer__visit-item">
                <IconWhatsApp className="site-footer__visit-icon" />
                <a
                  href={social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer__link site-footer__link--whatsapp"
                >
                  WhatsApp
                </a>
              </li>
              <li className="site-footer__visit-item">
                <IconMail className="site-footer__visit-icon" />
                <a href={`mailto:${contact.email}`} className="site-footer__link">
                  {contact.email}
                </a>
              </li>
              <li className="site-footer__visit-item">
                <IconClock className="site-footer__visit-icon" />
                <span>{f.visit.hours}</span>
              </li>
            </ul>
            <Link
              href={f.visit.mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__map-link"
            >
              {f.visit.mapLabel}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="site-footer__bar">
          <div className="site-footer__bar-inner">
            <p className="site-footer__copyright">
              © {year} {f.copyrightBrand} · {f.copyrightExtras}
            </p>
            <div className="site-footer__bar-actions">
              <div className="site-footer__socials">
                <SocialIconLink href={social.instagram} label="Instagram">
                  <svg
                    className="site-footer__social-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle
                      cx="17.5"
                      cy="6.5"
                      r="1"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </SocialIconLink>
                <SocialIconLink href={social.facebook} label="Facebook">
                  <svg
                    className="site-footer__social-svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M22 12a10 10 0 1 0-11.5 9.95v-7.03H7.9V12h2.65V9.41c0-2.62 1.56-4.06 3.94-4.06 1.14 0 2.33.2 2.33.2v2.56h-1.31c-1.3 0-1.7.8-1.7 1.63V12h2.89l-.46 2.92h-2.43v7.03A10 10 0 0 0 22 12Z" />
                  </svg>
                </SocialIconLink>
                <SocialIconLink href={social.youtube} label="YouTube">
                  <svg
                    className="site-footer__social-svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M23.5 7.2s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1C17.1 3.5 12 3.5 12 3.5h-.01S6.9 3.5 3.8 3.44c-.46.05-1.46.06-2.36 1C.73 5.56.5 7.2.5 7.2S.16 9.05.16 10.9v1.78c0 1.85.34 3.7.34 3.7s.23 1.64.94 2.36c.9.94 2.08.91 2.61 1 1.9.18 8.09.21 8.09.21s5.11-.01 8.22-.27c.46-.05 1.46-.06 2.36-1 .71-.72.94-2.36.94-2.36s.34-1.85.34-3.7V10.9c0-1.85-.34-3.7-.34-3.7ZM9.75 14.25v-5.5L15.5 11.5l-5.75 2.75Z" />
                  </svg>
                </SocialIconLink>
                <SocialIconLink href={social.whatsapp} label="WhatsApp">
                  <svg
                    className="site-footer__social-svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                </SocialIconLink>
              </div>
              <ul className="site-footer__legal">
                {f.legalLinks.map((item, i) => (
                  <li key={item.href} className="site-footer__legal-item">
                    {i > 0 ? (
                      <span className="site-footer__legal-sep" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    <Link href={item.href} className="site-footer__legal-link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
