"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Menu, Phone, Search, ShoppingBag, X } from "lucide-react";

import contactData from "@/data/contactDatas.json";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useGoldRates } from "@/contexts/GoldRatesContext";
import { saveReturnPath } from "@/lib/authRedirect";
import { formatInr, formatPercentChange } from "@/lib/goldRates";
import type { MetalRateItem } from "@/types/goldRate";
import { getImageUrl } from "@/utils/cloudinary";

import "./css/header.css";

const ratesConfig = contactData.heroSection.rates;

function trendClass(status: MetalRateItem["status"] | undefined): string {
  if (status === "increased") return "site-header__ticker-trend--up";
  if (status === "decreased") return "site-header__ticker-trend--down";
  return "site-header__ticker-trend--same";
}

function trendArrow(status: MetalRateItem["status"] | undefined): string {
  if (status === "increased") return "↑";
  if (status === "decreased") return "↓";
  return "→";
}

function TickerItem({
  label,
  rate,
  loading,
  unitSuffix,
  fractionDigits,
}: {
  label: string;
  rate?: MetalRateItem;
  loading: boolean;
  unitSuffix: string;
  fractionDigits: number;
}) {
  if (loading || !rate) {
    return (
      <span className="site-header__ticker-item">
        <span className="site-header__ticker-label">{label}</span>
        <span className="site-header__ticker-price">Loading…</span>
      </span>
    );
  }

  return (
    <span className="site-header__ticker-item">
      <span className="site-header__ticker-label">{label}</span>
      <span className="site-header__ticker-price">
        {formatInr(rate.current, fractionDigits)}
        {unitSuffix}
      </span>
      <span
        className={`site-header__ticker-trend ${trendClass(rate.status)}`}
        aria-hidden
      >
        {trendArrow(rate.status)} {formatPercentChange(rate.percentChange)}
      </span>
    </span>
  );
}

function RatesTicker() {
  const { payload, loading } = useGoldRates();
  const live = payload?.data;

  const items = (
    <>
      <TickerItem
        label={ratesConfig.gold22k.label}
        rate={live?.gold22k}
        loading={loading}
        unitSuffix={ratesConfig.gold22k.unitSuffix}
        fractionDigits={ratesConfig.gold22k.fractionDigits ?? 2}
      />
      <span className="site-header__ticker-sep" aria-hidden>
        ◆
      </span>
      <TickerItem
        label={ratesConfig.silver1kg.label}
        rate={live?.silver1kg}
        loading={loading}
        unitSuffix={ratesConfig.silver1kg.unitSuffix}
        fractionDigits={ratesConfig.silver1kg.fractionDigits ?? 2}
      />
      <span className="site-header__ticker-sep" aria-hidden>
        ◆
      </span>
      <span className="site-header__ticker-item">
        <span className="site-header__ticker-label">{ratesConfig.location}</span>
      </span>
    </>
  );

  return (
    <div
      className="site-header__ticker"
      role="region"
      aria-label="Live gold and silver rates"
    >
      <div className="site-header__ticker-viewport">
        {loading && !live ? (
          <span className="site-header__ticker-skeleton" aria-busy="true" />
        ) : (
          <div className="site-header__ticker-track" aria-live="polite">
            <div className="site-header__ticker-group">{items}</div>
            <div className="site-header__ticker-group" aria-hidden>
              {items}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isLoggedIn,
    userName,
    loading: authLoading,
    logout,
    goToLogin,
  } = useCustomerAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [cartCount] = useState(0);

  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /** Min px before toggling recently-viewed (avoids flicker on micro-scroll). */
  const RECENT_SCROLL_DELTA = 12;
  const RECENT_TOP_SHOW_Y = 20;

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateOnScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 30);

      if (currentY <= RECENT_TOP_SHOW_Y) {
        setShowRecentlyViewed(true);
        lastScrollY.current = currentY;
        scrollTicking.current = false;
        return;
      }

      const delta = currentY - lastScrollY.current;

      if (delta >= RECENT_SCROLL_DELTA) {
        setShowRecentlyViewed(false);
        lastScrollY.current = currentY;
      } else if (delta <= -RECENT_SCROLL_DELTA) {
        lastScrollY.current = currentY;
      }

      scrollTicking.current = false;
    };

    const handleScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(updateOnScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isSearchOpen]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setIsSearchOpen(false);
    setIsMenuOpen(false);

    if (query) {
      router.push(`/products?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/products");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getInitial = () =>
    userName ? userName.charAt(0).toUpperCase() : "U";

  const headerClass = [
    "site-header",
    isScrolled ? "site-header--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const recentClass = [
    "site-header__recent",
    showRecentlyViewed ? "" : "site-header__recent--hidden",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass}>
      <RatesTicker />

      <div className="site-header__main">
        <div className="site-header__main-inner">
          <Link href="/" className="site-header__logo">
            {!logoError ? (
              <Image
                src={getImageUrl(contactData.brand.logo)}
                alt={contactData.brand.name}
                width={45}
                height={45}
                className="site-header__logo-img"
                style={{ width: "auto", height: "auto" }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="site-header__logo-fallback" aria-hidden>
                💎
              </div>
            )}

            <div className="site-header__brand-text">
              <h2 className="site-header__brand-name">
                {contactData.brand.name}
              </h2>
              <p className="site-header__brand-tagline">
                {contactData.brand.tagline}
              </p>
            </div>
          </Link>

          <nav className="site-header__nav" aria-label="Main navigation">
            {contactData.navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "site-header__nav-link",
                    isActive ? "site-header__nav-link--active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="site-header__actions">
            <div className="site-header__phone">
              <Phone size={16} aria-hidden />
              <span>{contactData.contact.phone}</span>
            </div>

            <Link
              href={contactData.header.videoCallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-header__video-link"
            >
              {contactData.header.videoCallText}
            </Link>

            <button
              type="button"
              className="site-header__icon-btn"
              aria-label="Search"
              aria-expanded={isSearchOpen}
              onClick={() => setIsSearchOpen((open) => !open)}
              suppressHydrationWarning
            >
              <Search size={20} />
            </button>

            <Link
              href="/cart"
              className="site-header__icon-btn site-header__cart"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 ? (
                <span className="site-header__cart-badge">{cartCount}</span>
              ) : null}
            </Link>

            {!authLoading && isLoggedIn ? (
              <div className="site-header__profile-wrap">
                <button
                  type="button"
                  className="site-header__profile-btn"
                  aria-label="Account menu"
                  suppressHydrationWarning
                >
                  {getInitial()}
                </button>

                <div className="site-header__dropdown">
                  <div className="site-header__dropdown-head">
                    <p className="site-header__dropdown-name">{userName}</p>
                    <p className="site-header__dropdown-sub">My Account</p>
                  </div>

                  <Link href="/profile" className="site-header__dropdown-link">
                    My Profile
                  </Link>
                  <Link href="/orders" className="site-header__dropdown-link">
                    My Orders
                  </Link>
                  <Link href="/wishlist" className="site-header__dropdown-link">
                    Wishlist
                  </Link>
                  <button
                    type="button"
                    className="site-header__dropdown-logout"
                    onClick={handleLogout}
                    suppressHydrationWarning
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : !authLoading ? (
              <div className="site-header__auth">
                <button
                  type="button"
                  className="site-header__login-btn"
                  onClick={goToLogin}
                  suppressHydrationWarning
                >
                  <LogIn size={16} aria-hidden />
                  <span>Login</span>
                </button>

                <button
                  type="button"
                  className="site-header__signup-btn"
                  onClick={() => {
                    saveReturnPath();
                    router.push("/signup");
                  }}
                  suppressHydrationWarning
                >
                  Sign Up
                </button>
              </div>
            ) : null}

            <button
              type="button"
              className="site-header__icon-btn site-header__menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              suppressHydrationWarning
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isSearchOpen ? (
        <div
          className="site-header__search-backdrop"
          role="presentation"
          onClick={() => setIsSearchOpen(false)}
        />
      ) : null}

      <div
        className={[
          "site-header__search",
          isSearchOpen ? "site-header__search--open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <form
          className="site-header__search-form"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <Search size={18} className="site-header__search-icon" aria-hidden />
          <input
            ref={searchInputRef}
            type="search"
            className="site-header__search-input"
            placeholder="Search jewellery…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search products"
          />
          <button type="submit" className="site-header__search-submit">
            Search
          </button>
          <button
            type="button"
            className="site-header__search-close"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </form>
      </div>

      <div className={recentClass}>
        <span className="site-header__recent-label">Recently Viewed:</span>
        <span className="site-header__recent-value">
          {contactData.header.recentlyViewed}
        </span>
      </div>

      {isMenuOpen ? (
        <div className="site-header__mobile">
          <div className="site-header__mobile-inner">
            {contactData.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="site-header__mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href={contactData.header.videoCallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-header__mobile-link"
              onClick={() => setIsMenuOpen(false)}
            >
              {contactData.header.videoCallText}
            </Link>

            <Link
              href="/cart"
              className="site-header__mobile-cart"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingBag size={18} aria-hidden />
              Cart
            </Link>

            {!authLoading && !isLoggedIn ? (
              <>
                <button
                  type="button"
                  className="site-header__mobile-link"
                  onClick={() => {
                    setIsMenuOpen(false);
                    goToLogin();
                  }}
                  suppressHydrationWarning
                >
                  Login
                </button>

                <button
                  type="button"
                  className="site-header__mobile-signup"
                  onClick={() => {
                    setIsMenuOpen(false);
                    saveReturnPath();
                    router.push("/signup");
                  }}
                  suppressHydrationWarning
                >
                  Create Account
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
