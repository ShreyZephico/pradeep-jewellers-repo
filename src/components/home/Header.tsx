"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import {
  Phone,
  LogIn,
  Menu,
  ShoppingBag,
  X,
} from "lucide-react";

import HeaderNavSearch from "@/components/home/HeaderNavSearch";
import { useCart } from "@/contexts/CartContext";
import contactData from "@/data/contactDatas.json";
import productContent from "@/lib/productContent";
import { getImageUrl } from "@/utils/cloudinary";

const cartCopy = productContent.cart;

export default function Header() {
  const router = useRouter();
  const { cart, goToCart, setAuthenticated } = useCart();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [logoError, setLogoError] = useState(false);

  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    fetch("/api/auth/check")
      .then((response) => response.json())
      .then((data) => {
        if (!data.isAuthenticated) {
          setIsLoggedIn(false);
          setAuthenticated(false);
          return;
        }

        const email =
          data.email || localStorage.getItem("customerEmail");

        const name = email
          ? email.split("@")[0]
          : "User";

        setUserName(name);
        setIsLoggedIn(true);
        setAuthenticated(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setAuthenticated(false);
      });
  }, []);

  // =========================
  // SCROLL EFFECT
  // =========================

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  // =========================
  // HANDLERS
  // =========================

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
    }).catch(() => null);

    localStorage.removeItem("customerAccessToken");
    localStorage.removeItem("customerEmail");

    setIsLoggedIn(false);
    setAuthenticated(false);

    router.push("/");
  };

  const openCart = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    goToCart();
  };

  const getInitial = () => {
    return userName
      ? userName.charAt(0).toUpperCase()
      : "U";
  };

  // =========================
  // JSX
  // =========================

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white shadow-md"
          : "bg-white"
      }`}
    >
      {/* TOP BAR */}

      <div className="bg-amber-50 text-center py-2 text-sm">
        <p className="text-amber-700">
          {contactData.header.promoText}
        </p>
      </div>

      {/* MAIN HEADER */}

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">

          {/* LOGO */}

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            {!logoError ? (
              <Image
                src={getImageUrl(contactData.brand.logo)}
                alt={contactData.brand.name}
                width={45}
                height={45}
                className="max-h-[45px] max-w-[45px] rounded-full text-black-700"
                style={{ width: "auto", height: "auto" }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
                💎
              </div>
            )}

            <div className="hidden sm:block">
              <h2 className="font-bold text-lg">
                {contactData.brand.name}
              </h2>

              <p className="text-xs text-gray-700">
                {contactData.brand.tagline}
              </p>
            </div>
          </Link>

          {/* DESKTOP MENU */}

          <nav className="hidden md:flex items-center gap-6">
            {contactData.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm hover:text-amber-600 transition-colors text-gray-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block">
            <HeaderNavSearch variant="expanded" />
          </div>

          {/* RIGHT SECTION */}

          <div className="flex items-center gap-4">

            {/* PHONE */}

            <div className="hidden lg:flex items-center gap-2 text-sm">
              <Phone size={16} />

              <span className="text-gray-700">
                {contactData.contact.phone}
              </span>
            </div>

            {/* VIDEO CALL */}

            <Link
              href="/video-call"
              className="hidden lg:block text-sm hover:text-amber-600 text-gray-700"
            >
              {contactData.header.videoCallText}
            </Link>

            <div className="lg:hidden">
              <HeaderNavSearch variant="compact" />
            </div>

            <button
              type="button"
              className="header-cart-btn"
              onClick={openCart}
              aria-label={
                isLoggedIn && cart.totalQuantity > 0
                  ? `${cartCopy.openCart} (${cart.totalQuantity} items)`
                  : cartCopy.openCart
              }
              suppressHydrationWarning
            >
              <span className="header-cart-icon-wrap">
                <ShoppingBag size={22} strokeWidth={1.75} aria-hidden />
                {isLoggedIn && cart.totalQuantity > 0 ? (
                  <span className="header-cart-badge" aria-hidden>
                    {cart.totalQuantity > 99 ? "99+" : cart.totalQuantity}
                  </span>
                ) : null}
              </span>
            </button>

            {/* LOGIN / PROFILE */}

            {isLoggedIn ? (
              <div className="relative group">

                <button
                  type="button"
                  suppressHydrationWarning
                  className="w-10 h-10 rounded-full bg-amber-600 text-white font-semibold"
                >
                  {getInitial()}
                </button>

                {/* DROPDOWN */}

                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">

                  <div className="p-3 border-b">
                    <p className="font-semibold">
                      {userName}
                    </p>

                    <p className="text-xs text-gray-500">
                      My Account
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    className="block px-4 py-2 hover:bg-gray-50"
                  >
                    My Profile
                  </Link>

                  <Link
                    href="/orders"
                    className="block px-4 py-2 hover:bg-gray-50"
                  >
                    My Orders
                  </Link>

                  <Link
                    href="/wishlist"
                    className="block px-4 py-2 hover:bg-gray-50"
                  >
                    Wishlist
                  </Link>

                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-1"
                >
                  <LogIn size={16} />

                  <span>Login</span>
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => router.push("/signup")}
                  className="bg-amber-600 text-white px-4 py-2 rounded-md"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* MOBILE MENU BUTTON */}

            <button
              type="button"
              suppressHydrationWarning
              className="md:hidden"
              onClick={() =>
                setIsMenuOpen(!isMenuOpen)
              }
            >
              {isMenuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RECENTLY VIEWED */}

      <div className="bg-gray-50 text-center py-2 text-sm border-t">
        <span className="text-gray-500">
          Recently Viewed:
        </span>

        <span className="ml-2 text-amber-700 font-medium">
          {contactData.header.recentlyViewed}
        </span>
      </div>

      {/* MOBILE MENU */}

      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="flex flex-col p-4 gap-2">
            <HeaderNavSearch
              variant="mobile"
              onNavigate={() => setIsMenuOpen(false)}
            />

            {contactData.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2"
                onClick={() =>
                  setIsMenuOpen(false)
                }
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/video-call"
              className="py-2"
            >
              {contactData.header.videoCallText}
            </Link>

            <button
              type="button"
              className="flex items-center justify-between py-2 text-left"
              onClick={() => {
                setIsMenuOpen(false);
                openCart();
              }}
              suppressHydrationWarning
            >
              <span>{cartCopy.pageTitle}</span>
              {isLoggedIn && cart.totalQuantity > 0 ? (
                <span className="header-cart-badge">{cart.totalQuantity}</span>
              ) : null}
            </button>

            {!isLoggedIn ? (
              <>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() =>
                    router.push("/login")
                  }
                  className="text-left py-2"
                >
                  Login
                </button>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() =>
                    router.push("/signup")
                  }
                  className="bg-amber-600 text-white py-2 rounded-md"
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className="py-2"
                >
                  My Profile
                </Link>

                <Link
                  href="/orders"
                  className="py-2"
                >
                  My Orders
                </Link>

                <Link
                  href="/wishlist"
                  className="py-2"
                >
                  Wishlist
                </Link>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={handleLogout}
                  className="text-left py-2 text-red-600"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}