"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./css/Navbar.module.css";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import { getImageUrl } from "@/utils/cloudinary";

// Import contact data
import contactData from "@/data/contactData.json";

const menuItems = [
  { label: "Home", href: "/landing#home" },
  { label: "Collections", href: "/landing#collections" },
  { label: "Products", href: "/products" },
  { label: "Craft", href: "/landing#craftsmanship" },
  { label: "Reviews", href: "/landing#testimonials" },
  { label: "Contact", href: "/landing#contact" },
];

function scrollToHash(href: string) {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return false;

  const id = href.slice(hashIndex + 1);
  if (!id) return false;

  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // Check login status on mount
  useEffect(() => {
    fetch("/api/auth/check")
      .then((response) =>
        parseJsonResponse<{ isAuthenticated?: boolean; email?: string }>(
          response
        )
      )
      .then((data) => {
        if (!data?.isAuthenticated) {
          setIsLoggedIn(false);
          return;
        }

        const email = data.email ?? localStorage.getItem("customerEmail");
        setIsLoggedIn(true);
        setUserName(email ? email.split("@")[0] : "User");
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 32);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/landing" || !window.location.hash) return;

    const id = window.location.hash.slice(1);
    if (!id) return;

    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [pathname]);

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (pathname !== "/landing" || !href.includes("#")) return;

    if (scrollToHash(href)) {
      event.preventDefault();
      window.history.replaceState(null, "", href);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    localStorage.removeItem("customerAccessToken");
    localStorage.removeItem("customerEmail");
    localStorage.removeItem("loginMethod");
    setIsLoggedIn(false);
    router.push("/landing");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  return (
    <header
      className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ""}`}
    >
      <div className={styles.container}>
        <Link
          href="/landing#home"
          className={styles.brand}
          aria-label="Go to homepage"
          onClick={(event) => handleNavClick(event, "/landing#home")}
        >
          <div className={styles.logoWrap}>
            {!logoError ? (
              <Image
                src={getImageUrl("v1777380043/logo_xlwrhp.png")}
                alt={`${contactData.brand.name} logo`}
                width={44}
                height={44}
                className={styles.logo}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className={styles.fallbackIcon}>💎</div>
            )}
          </div>
          <div>
            <p className={styles.brandName}>{contactData.brand.name}</p>
            <p className={styles.brandTag}>{contactData.brand.tagline}</p>
          </div>
        </Link>

        <nav className={styles.desktopMenu} aria-label="Primary">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.link}
              onClick={(event) => handleNavClick(event, item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/products" className={styles.secondaryAction}>
            Discover Pieces
          </Link>
          <Link
            href="/landing#contact"
            className={styles.primaryAction}
            onClick={(event) => handleNavClick(event, "/landing#contact")}
          >
            Book Appointment
          </Link>

          {/* ✅ Auth Buttons - Simple Version */}
          {isLoggedIn ? (
            <div className={styles.authWrapper}>
              <span className={styles.userNameText}>👋 {userName}</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          ) : (
            <div className={styles.authWrapper}>
              <button onClick={handleLogin} className={styles.loginButton}>
                Login
              </button>
              <button onClick={handleSignup} className={styles.signupButton}>
                Sign Up
              </button>
            </div>
          )}

          <button
            type="button"
            className={`${styles.mobileToggle} ${
              isMenuOpen ? styles.mobileToggleActive : ""
            }`}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        className={`${styles.mobileMenu} ${
          isMenuOpen ? styles.mobileMenuOpen : ""
        }`}
      >
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={styles.mobileLink}
            onClick={(event) => {
              handleNavClick(event, item.href);
              setIsMenuOpen(false);
            }}
          >
            {item.label}
          </Link>
        ))}
        
        {/* ✅ Mobile Auth Options */}
        {isLoggedIn ? (
          <button
            onClick={() => {
              handleLogout();
              setIsMenuOpen(false);
            }}
            className={styles.mobileLogoutButton}
          >
            🚪 Logout
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                handleLogin();
                setIsMenuOpen(false);
              }}
              className={styles.mobileLoginButton}
            >
              Login
            </button>
            <button
              onClick={() => {
                handleSignup();
                setIsMenuOpen(false);
              }}
              className={styles.mobileSignupButton}
            >
              Create Account
            </button>
          </>
        )}
      </div>
    </header>
  );
}
