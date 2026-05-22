"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { notifyAuthChanged } from "@/contexts/CustomerAuthContext";

const DISMISS_KEY = "googleOneTapDismissed";
const DISMISS_MS = 24 * 60 * 60 * 1000;
const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

type Props = {
  clientId: string;
  siteName?: string;
};

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function isDismissed(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const raw = sessionStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  return Number.isFinite(ts) && Date.now() - ts < DISMISS_MS;
}

function dismiss(): void {
  sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
  window.google?.accounts?.id?.cancel();
}

export default function GoogleOneTap({
  clientId,
  siteName = "Pradeep Jewellers",
}: Props) {
  const pathname = usePathname();
  const [gsiReady, setGsiReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintName, setHintName] = useState("your Google account");
  const [hintEmail, setHintEmail] = useState("google.com");
  const gsiInitialized = useRef(false);
  const buttonRendered = useRef(false);
  const cardShown = useRef(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const skip =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/api/auth");

  const finishLogin = useCallback(async (credential: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google/one-tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        name?: string;
        email?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Google sign-in failed");
      }
      if (data.name) setHintName(data.name);
      if (data.email) setHintEmail(data.email);
      localStorage.setItem("loginMethod", "google");
      if (data.email) localStorage.setItem("customerEmail", data.email);
      setShowCard(false);
      setLoggedIn(true);
      notifyAuthChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const openPopup = useCallback(() => {
    setLoading(true);
    setError(null);
    window.google?.accounts?.id?.cancel();
    const popup = window.open(
      "/api/auth/google?mode=login",
      "GoogleLogin",
      "width=520,height=640"
    );
    if (!popup) {
      setLoading(false);
      setError("Please allow popups to continue with Google.");
      return;
    }
    const onMsg = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      if (
        ev.data?.type === "GOOGLE_LOGIN_SUCCESS" ||
        ev.data?.type === "GOOGLE_SIGNUP_SUCCESS"
      ) {
        localStorage.setItem("loginMethod", "google");
        setShowCard(false);
        setLoggedIn(true);
        setLoading(false);
        window.removeEventListener("message", onMsg);
        notifyAuthChanged();
      }
      if (
        ev.data?.type === "GOOGLE_LOGIN_ERROR" ||
        ev.data?.type === "GOOGLE_SIGNUP_ERROR"
      ) {
        setError(ev.data.error ?? "Google sign-in failed");
        setLoading(false);
        window.removeEventListener("message", onMsg);
      }
    };
    window.addEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    setLoggedIn(null);
    fetch("/api/auth/check", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          isAuthenticated?: boolean;
          name?: string;
          email?: string;
        }) => {
          if (cancelled) return;
          if (d.isAuthenticated) {
            setLoggedIn(true);
            return;
          }
          if (d.name) setHintName(d.name);
          if (d.email) setHintEmail(d.email);
          setLoggedIn(false);
        }
      )
      .catch(() => {
        if (!cancelled) setLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [skip, pathname]);

  useEffect(() => {
    gsiInitialized.current = false;
    buttonRendered.current = false;
    cardShown.current = false;
    setShowCard(false);
    setError(null);
    window.google?.accounts?.id?.cancel();
  }, [pathname, clientId]);

  const initGsi = useCallback(() => {
    const id = window.google?.accounts?.id;
    if (!id || gsiInitialized.current) return id;

    gsiInitialized.current = true;
    id.initialize({
      client_id: clientId,
      callback: (res) => {
        if (res.credential) {
          void finishLogin(res.credential);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: true,
      use_fedcm_for_prompt: false,
    });
    return id;
  }, [clientId, finishLogin]);

  useEffect(() => {
    if (skip || !gsiReady || loggedIn !== false || isDismissed() || cardShown.current) {
      return;
    }

    cardShown.current = true;
    window.google?.accounts?.id?.cancel();
    initGsi();
    setShowCard(true);
  }, [skip, gsiReady, loggedIn, initGsi]);

  useEffect(() => {
    if (!showCard || !gsiReady || loggedIn !== false) return;
    const id = window.google?.accounts?.id;
    const el = buttonRef.current;
    if (!id || !el || buttonRendered.current) return;

    initGsi();
    el.innerHTML = "";
    id.renderButton(el, {
      type: "standard",
      theme: "filled_blue",
      size: "large",
      text: "continue_with",
      width: Math.min(360, el.offsetWidth || 360),
      shape: "rectangular",
    });
    buttonRendered.current = true;
  }, [showCard, gsiReady, loggedIn, initGsi]);

  useEffect(() => {
    return () => {
      window.google?.accounts?.id?.cancel();
    };
  }, []);

  if (skip || loggedIn === true || isDismissed()) {
    return null;
  }

  const showUi = loggedIn === false;

  return (
    <>
      {showUi ? (
        <Script
          src={GSI_SCRIPT}
          strategy="afterInteractive"
          onLoad={() => setGsiReady(true)}
        />
      ) : null}

      {showUi && showCard ? (
        <aside
          className="google-one-tap-fallback"
          role="dialog"
          aria-label="Sign in with Google"
        >
          <div className="google-one-tap-fallback__header">
            <GoogleLogo />
            <p className="google-one-tap-fallback__title">
              Sign in to {siteName} with Google
            </p>
            <button
              type="button"
              className="google-one-tap-fallback__close"
              aria-label="Close"
              onClick={() => {
                dismiss();
                setShowCard(false);
              }}
            >
              ×
            </button>
          </div>

          <div className="google-one-tap-fallback__body">
            <div className="google-one-tap-fallback__avatar" aria-hidden>
              {hintName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="google-one-tap-fallback__label">{hintName}</p>
              <p className="google-one-tap-fallback__hint">{hintEmail}</p>
            </div>
          </div>

          {error ? (
            <p className="google-one-tap-fallback__error" role="alert">
              {error}
            </p>
          ) : null}

          <div ref={buttonRef} className="google-one-tap-fallback__gsi-btn" />

          <button
            type="button"
            className="google-one-tap-fallback__popup-link"
            disabled={loading}
            onClick={openPopup}
          >
            {loading ? "Opening sign-in…" : "Having trouble? Sign in in a new window"}
          </button>

          <p className="google-one-tap-fallback__legal">
            To continue, Google will share your name, email address, and profile
            picture with {siteName}. See this site&apos;s privacy policy and
            terms of service.
          </p>
        </aside>
      ) : null}
    </>
  );
}
