"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

import data from "@/data/contactDatas.json";
import { useGoldRates } from "@/contexts/GoldRatesContext";
import { formatInr } from "@/lib/goldRates";
import { getImageUrl } from "@/utils/cloudinary";

const gold = "#c5a059";
const footerBg = "#1a1614";
const tickerBg = "#221e1b";

function DiamondSep({ className }: { className?: string }) {
  return (
    <span className={`mx-5 inline-flex text-[#c5a059] ${className ?? ""}`} aria-hidden>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 4 9l8 13 8-13-8-7Z" />
      </svg>
    </span>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6.6 3.2c.4-.1.9.1 1.1.5l1.4 2.8c.2.4.1.9-.2 1.2l-1.1 1.1a12 12 0 0 0 5.5 5.5l1.1-1.1c.3-.3.8-.4 1.2-.2l2.8 1.4c.4.2.6.7.5 1.1l-.5 2.4c-.1.5-.6.9-1.1 1a16 16 0 0 1-14-14c0-.5.4-1 1-1.1l2.4-.5Z" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
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
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 text-white/90 transition hover:border-[#c5a059] hover:text-[#c5a059]"
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

  const [logoError, setLogoError] = useState(false);
  const year = new Date().getFullYear();

  const tickerItems = [
    {
      label: ratesConfig.gold22k.label,
      price: live?.gold22k
        ? formatInr(live.gold22k.current)
        : "—",
    },
    {
      label: ratesConfig.gold24k.label,
      price: live?.gold24k
        ? formatInr(live.gold24k.current)
        : "—",
    },
    {
      label: ratesConfig.silver.label,
      price: live?.silver ? formatInr(live.silver.current) : "—",
    },
  ];

  function onNewsletter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) return;
    const subject = encodeURIComponent(f.newsletter.mailtoSubject);
    const body = encodeURIComponent(`Please add this email to the newsletter list: ${email}`);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
  }

  return (
    <footer className="relative text-white" style={{ backgroundColor: footerBg }}>
      <div
        className="overflow-hidden border-b border-white/[0.06] py-3"
        style={{ backgroundColor: tickerBg }}
      >
        <div className="footer-ticker-track items-center gap-0 pr-8">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {dup > 0 ? <DiamondSep /> : null}
              {tickerItems.map((item, i) => (
                <span key={`${dup}-${item.label}-${i}`} className="flex items-center">
                  {i > 0 ? <DiamondSep /> : null}
                  <span className="inline-flex items-center whitespace-nowrap text-sm md:text-base">
                    <span style={{ color: gold }} className="font-medium">
                      {item.label}
                    </span>
                    <span style={{ color: gold }} className="ml-2 font-semibold tabular-nums">
                      {item.price}
                    </span>
                    <span className="ml-1 text-white/55">/ gram</span>
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="lg:pr-4">
            <Link href="/" className="inline-flex items-center gap-3">
              {!logoError ? (
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#c5a059]/40 bg-[#c5a059]/15">
                  <Image
                    src={getImageUrl(brand.logo)}
                    alt=""
                    width={48}
                    height={48}
                    className="max-h-12 max-w-12 object-contain p-1"
                    style={{ width: "auto", height: "auto" }}
                    onError={() => setLogoError(true)}
                  />
                </span>
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c5a059]/50 font-serif text-xl text-[#c5a059]">
                  {brand.name.charAt(0)}
                </span>
              )}
              <span className="font-serif text-2xl tracking-tight text-white">
                {brand.name}
              </span>
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-white/80">
              {f.brandDescription}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/55">
              {f.complianceLine}
            </p>

            <form
              className="mt-8 flex max-w-sm gap-0 overflow-hidden rounded-md border border-white/15 bg-black/25"
              onSubmit={onNewsletter}
            >
              <input
                name="email"
                type="email"
                required
                suppressHydrationWarning
                autoComplete="email"
                placeholder={f.newsletter.placeholder}
                className="min-h-[48px] flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button
                type="submit"
                suppressHydrationWarning
                className="flex w-12 shrink-0 items-center justify-center text-lg text-white transition hover:bg-[#c5a059]/90"
                style={{ backgroundColor: gold }}
                aria-label="Subscribe to newsletter"
              >
                →
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: gold }}>
              Shop
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-white/85">
              {f.shopLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition hover:text-[#c5a059]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: gold }}>
              Discover
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-white/85">
              {f.discoverLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition hover:text-[#c5a059]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: gold }}>
              Visit us
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-white/85">
              <li className="flex gap-3">
                <IconPin className="mt-0.5 shrink-0 text-[#c5a059]" />
                <span>{f.visit.address}</span>
              </li>
              <li className="flex gap-3">
                <IconPhone className="mt-0.5 shrink-0 text-[#c5a059]" />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-[#c5a059]">
                  {contact.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <IconMail className="mt-0.5 shrink-0 text-[#c5a059]" />
                <a href={`mailto:${contact.email}`} className="hover:text-[#c5a059]">
                  {contact.email}
                </a>
              </li>
              <li className="flex gap-3">
                <IconClock className="mt-0.5 shrink-0 text-[#c5a059]" />
                <span>{f.visit.hours}</span>
              </li>
            </ul>
            <Link
              href={f.visit.mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c5a059] transition hover:gap-3"
            >
              {f.visit.mapLabel}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <p className="text-center text-xs text-white/55 md:text-left">
              © {year} {f.copyrightBrand} · {f.copyrightExtras}
            </p>
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
              <div className="flex gap-3">
                <SocialIconLink href={social.instagram} label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </SocialIconLink>
                <SocialIconLink href={social.facebook} label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12a10 10 0 1 0-11.5 9.95v-7.03H7.9V12h2.65V9.41c0-2.62 1.56-4.06 3.94-4.06 1.14 0 2.33.2 2.33.2v2.56h-1.31c-1.3 0-1.7.8-1.7 1.63V12h2.89l-.46 2.92h-2.43v7.03A10 10 0 0 0 22 12Z" />
                  </svg>
                </SocialIconLink>
                <SocialIconLink href={social.youtube} label="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 7.2s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1C17.1 3.5 12 3.5 12 3.5h-.01S6.9 3.5 3.8 3.44c-.46.05-1.46.06-2.36 1C.73 5.56.5 7.2.5 7.2S.16 9.05.16 10.9v1.78c0 1.85.34 3.7.34 3.7s.23 1.64.94 2.36c.9.94 2.08.91 2.61 1 1.9.18 8.09.21 8.09.21s5.11-.01 8.22-.27c.46-.05 1.46-.06 2.36-1 .71-.72.94-2.36.94-2.36s.34-1.85.34-3.7V10.9c0-1.85-.34-3.7-.34-3.7ZM9.75 14.25v-5.5L15.5 11.5l-5.75 2.75Z" />
                  </svg>
                </SocialIconLink>
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-white/55">
                {f.legalLinks.map((item, i) => (
                  <span key={item.href} className="inline-flex items-center">
                    {i > 0 ? <span className="mx-1 text-white/30">·</span> : null}
                    <Link href={item.href} className="hover:text-[#c5a059]">
                      {item.label}
                    </Link>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
