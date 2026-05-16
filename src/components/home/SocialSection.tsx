"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo } from "react";

import data from "@/data/contactDatas.json";

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

function SocialCircle({
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
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2D2D2D]/12 bg-white text-[#2D2D2D] transition hover:border-[#A67C37]/40 hover:text-[#A67C37]"
    >
      {children}
    </Link>
  );
}

export default function SocialSection() {
  const s = data.socialSection;
  const social = data.social;
  const instaUrl = social.instagram;

  const waBase = useMemo(() => {
    const u = social.whatsapp;
    const m = u.match(/wa\.me\/(\d+)/);
    return m ? m[1] : "919876543210";
  }, [social.whatsapp]);

  function handleBroadcast(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = String(fd.get("phone") ?? "").replace(/\D/g, "");
    if (!raw) return;
    const msg = s.broadcast.whatsappMessageTemplate.replace("{phone}", raw);
    window.open(
      `https://wa.me/${waBase}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <section className="bg-[#FDFBF7] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div>
            <div className="mb-5 flex items-center gap-4">
              <span className="h-px w-10 shrink-0 bg-[#A67C37] md:w-12" aria-hidden />
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#A67C37]">
                {s.handle}
              </p>
            </div>

            <h2 className="max-w-md font-serif text-3xl font-light leading-tight tracking-tight text-[#1A1410] md:text-4xl lg:text-[2.5rem]">
              {s.title}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#1A1410]/65 md:text-base">
              {s.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <SocialCircle href={social.instagram} label="Instagram">
                <InstagramGlyph className="h-5 w-5" />
              </SocialCircle>
              <SocialCircle href={social.facebook} label="Facebook">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M22 12a10 10 0 1 0-11.5 9.95v-7.03H7.9V12h2.65V9.41c0-2.62 1.56-4.06 3.94-4.06 1.14 0 2.33.2 2.33.2v2.56h-1.31c-1.3 0-1.7.8-1.7 1.63V12h2.89l-.46 2.92h-2.43v7.03A10 10 0 0 0 22 12Z" />
                </svg>
              </SocialCircle>
              <SocialCircle href={social.youtube} label="YouTube">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M23.5 7.2s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1C17.1 3.5 12 3.5 12 3.5h-.01S6.9 3.5 3.8 3.44c-.46.05-1.46.06-2.36 1C.73 5.56.5 7.2.5 7.2S.16 9.05.16 10.9v1.78c0 1.85.34 3.7.34 3.7s.23 1.64.94 2.36c.9.94 2.08.91 2.61 1 1.9.18 8.09.21 8.09.21s5.11-.01 8.22-.27c.46-.05 1.46-.06 2.36-1 .71-.72.94-2.36.94-2.36s.34-1.85.34-3.7V10.9c0-1.85-.34-3.7-.34-3.7ZM9.75 14.25v-5.5L15.5 11.5l-5.75 2.75Z" />
                </svg>
              </SocialCircle>
            </div>

            <div className="mt-10 max-w-md rounded-lg border border-[#1A1410]/6 bg-[#F5F0E8] p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[#25D366]" aria-hidden>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-[#1A1410]">
                    {s.broadcast.title}
                  </p>
                  <p className="mt-1 text-sm text-[#1A1410]/60">
                    {s.broadcast.subtitle}
                  </p>
                </div>
              </div>
              <form
                className="mt-5 flex flex-col gap-3 sm:flex-row"
                onSubmit={handleBroadcast}
              >
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  suppressHydrationWarning
                  autoComplete="tel"
                  placeholder={s.broadcast.inputPlaceholder}
                  className="min-h-[44px] flex-1 rounded-md border border-[#1A1410]/12 bg-white px-4 text-sm text-[#1A1410] outline-none ring-0 placeholder:text-[#1A1410]/35 focus:border-[#A67C37]/50"
                />
                <button
                  type="submit"
                  suppressHydrationWarning
                  className="min-h-[44px] shrink-0 rounded-md bg-[#A67C37] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#8f6a2f]"
                >
                  {s.broadcast.buttonText}
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {s.gridImages.map((img) => {
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
                  className="group relative aspect-square overflow-hidden bg-[#EDE9E2]"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 1024px) 33vw, 200px"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  >
                    <InstagramGlyph className="h-10 w-10 text-white md:h-12 md:w-12" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
