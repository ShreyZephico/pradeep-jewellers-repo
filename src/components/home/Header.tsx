"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Menu, Phone, ShoppingBag, X } from "lucide-react";

import CategoryNavBar from "@/components/home/CategoryNavBar";
import HeaderNavSearch from "@/components/home/HeaderNavSearch";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useGoldRates } from "@/contexts/GoldRatesContext";
import { saveReturnPath } from "@/lib/authRedirect";
import productContent from "@/lib/productContent";
import { formatInr, formatPercentChange } from "@/lib/goldRates";
import type { MetalRateItem } from "@/types/goldRate";
import { getImageUrl } from "@/utils/cloudinary";
import contactData from "@/data/contactDatas.json";

import "./css/header.css";

const cartCopy = productContent.cart;
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        {!mounted || (loading && !live) ? (
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
  const { cart, goToCart, setAuthenticated } = useCart();
  const {
    isLoggedIn,
    userName,
    loading: authLoading,
    logout,
    goToLogin,
  } = useCustomerAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);

  const RECENT_SCROLL_DELTA = 12;
  const RECENT_TOP_SHOW_Y = 20;

  useEffect(() => {
    setAuthenticated(isLoggedIn);
  }, [isLoggedIn, setAuthenticated]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateOnScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 30);

      if (currentY <= RECENT_TOP_SHOW_Y) {
        lastScrollY.current = currentY;
        scrollTicking.current = false;
        return;
      }

      const delta = currentY - lastScrollY.current;
      if (delta >= RECENT_SCROLL_DELTA) {
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

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    router.push("/");
  };

  const openCart = () => {
    goToCart();
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  const getInitial = () =>
    userName ? userName.charAt(0).toUpperCase() : "U";

  const headerClass = [
    "site-header",
    isScrolled ? "site-header--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cartQty = cart.totalQuantity;

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
                width={36}
                height={36}
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
            <Link
              href={contactData.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="site-header__phone"
            >
              <Phone size={14} aria-hidden />
              <span>{contactData.contact.phone}</span>
            </Link>

            <Link
              href={contactData.header.videoCallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-header__video-link"
            >
              {contactData.header.videoCallText}
            </Link>

            <div className="site-header__search-slot">
              <HeaderNavSearch variant="compact" />
            </div>

            <button
              type="button"
              className="site-header__icon-btn site-header__cart header-cart-btn"
              onClick={openCart}
              aria-label={
                cartQty > 0
                  ? `${cartCopy.openCart} (${cartQty} items)`
                  : cartCopy.openCart
              }
              suppressHydrationWarning
            >
              <span className="header-cart-icon-wrap">
                <ShoppingBag size={18} strokeWidth={1.75} aria-hidden />
                {cartQty > 0 ? (
                  <span className="header-cart-badge" aria-hidden>
                    {cartQty > 99 ? "99+" : cartQty}
                  </span>
                ) : null}
              </span>
            </button>

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
                  aria-label="Login"
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
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      <CategoryNavBar />

      {isMenuOpen ? (
        <>
          <button
            type="button"
            className="site-header__mobile-backdrop"
            aria-label="Close menu"
            onClick={() => setIsMenuOpen(false)}
            suppressHydrationWarning
          />
          <div className="site-header__mobile" role="dialog" aria-modal="true">
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
              href={contactData.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="site-header__mobile-link"
              onClick={() => setIsMenuOpen(false)}
            >
              {contactData.contact.phone}
            </Link>

            <Link
              href={contactData.header.videoCallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-header__mobile-link"
              onClick={() => setIsMenuOpen(false)}
            >
              {contactData.header.videoCallText}
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
        </>
      ) : null}
    </header>
  );
}
