"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  CATEGORY_NAV_ITEMS,
  type CategoryNavItem,
  type CategoryNavMetalLink,
  type CategoryNavPromo,
} from "@/lib/categoryNav";

import "./css/category-nav.css";

const HOVER_CLOSE_MS = 120;

function MetalSwatch({ swatch }: { swatch?: CategoryNavMetalLink["swatch"] }) {
  if (!swatch) return null;
  return (
    <span
      className={`category-nav__swatch category-nav__swatch--${swatch}`}
      aria-hidden
    />
  );
}

function PromoCard({ promo }: { promo: CategoryNavPromo }) {
  return (
    <Link href={promo.href} className="category-nav__promo-card">
      <span className="category-nav__promo-media">
        <Image
          src={promo.image}
          alt={promo.imageAlt}
          fill
          sizes="(min-width: 1100px) 220px, 40vw"
          className="category-nav__promo-img"
        />
      </span>
      <span className="category-nav__promo-overlay" aria-hidden />
      <span className="category-nav__promo-content">
        <span className="category-nav__promo-label">{promo.label}</span>
        <span className="category-nav__promo-cta">Shop now</span>
      </span>
    </Link>
  );
}

function MegaMenuPanel({ item }: { item: CategoryNavItem }) {
  return (
    <div className="category-nav__mega-inner">
      <div className="category-nav__mega-grid">
        <section className="category-nav__mega-col">
          <h3 className="category-nav__mega-heading">Featured</h3>
          <ul className="category-nav__mega-list">
            {item.featured.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="category-nav__mega-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="category-nav__mega-col">
          <h3 className="category-nav__mega-heading">By style</h3>
          <ul className="category-nav__mega-list">
            {item.styles.map((link, index) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={
                    index === 0
                      ? "category-nav__mega-link category-nav__mega-link--strong"
                      : "category-nav__mega-link"
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="category-nav__mega-col">
          <h3 className="category-nav__mega-heading">By metal &amp; stone</h3>
          <ul className="category-nav__mega-list category-nav__mega-list--metals">
            {item.metals.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="category-nav__mega-link category-nav__mega-link--metal">
                  <MetalSwatch swatch={link.swatch} />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="category-nav__mega-col">
          <h3 className="category-nav__mega-heading">By price</h3>
          <ul className="category-nav__mega-list">
            {item.prices.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="category-nav__mega-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="category-nav__mega-promos">
          {item.promos.map((promo) => (
            <PromoCard key={promo.label} promo={promo} />
          ))}
        </div>
      </div>

      <div className="category-nav__mega-footer">
        {item.audiences.map((link, index) => (
          <span key={link.label} className="category-nav__audience-wrap">
            {index > 0 ? (
              <span className="category-nav__audience-sep" aria-hidden>
                |
              </span>
            ) : null}
            <Link href={link.href} className="category-nav__audience-link">
              {link.label}
            </Link>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CategoryNavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategoryId =
    pathname === "/products" ? searchParams.get("category")?.trim().toLowerCase() : null;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const activeItem = CATEGORY_NAV_ITEMS.find((c) => c.id === activeId);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openCategory = useCallback(
    (id: string) => {
      clearCloseTimer();
      setActiveId(id);
    },
    [clearCloseTimer]
  );

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setActiveId(null);
    }, HOVER_CLOSE_MS);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    setActiveId(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!activeId) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveId(null);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeId]);

  return (
    <div
      className="category-nav"
      ref={barRef}
      onMouseLeave={scheduleClose}
    >
      <div className="category-nav__bar">
        <div className="category-nav__bar-inner">
          <button
            type="button"
            className="category-nav__mobile-toggle"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            Shop by category
            <ChevronDown
              size={16}
              className={mobileOpen ? "category-nav__chevron--open" : ""}
              aria-hidden
            />
          </button>

          <ul className="category-nav__list" role="menubar" aria-label="Shop by category">
            {CATEGORY_NAV_ITEMS.map((item) => {
              const isHoverActive = activeId === item.id;
              const isSelected = selectedCategoryId === item.id;
              return (
                <li
                  key={item.id}
                  role="none"
                  className="category-nav__item"
                  onMouseEnter={() => openCategory(item.id)}
                  onFocus={() => openCategory(item.id)}
                >
                  <Link
                    href={`/products?category=${item.id}`}
                    role="menuitem"
                    aria-haspopup="true"
                    aria-expanded={isHoverActive}
                    aria-current={isSelected ? "page" : undefined}
                    className={`category-nav__tab${
                      isHoverActive ? " category-nav__tab--active" : ""
                    }${isSelected ? " category-nav__tab--selected" : ""}`}
                    onClick={() => setActiveId(null)}
                  >
                    {item.pluralLabel}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {mobileOpen ? (
        <div className="category-nav__mobile-panel">
          <ul className="category-nav__mobile-list">
            {CATEGORY_NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/products?category=${item.id}`}
                  className="category-nav__mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.pluralLabel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {activeItem ? (
        <div
          className="category-nav__mega"
          onMouseEnter={clearCloseTimer}
          role="region"
          aria-label={`${activeItem.pluralLabel} menu`}
        >
          <MegaMenuPanel item={activeItem} />
        </div>
      ) : null}
    </div>
  );
}
