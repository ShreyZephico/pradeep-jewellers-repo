"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  notifyAuthChanged,
  useCustomerAuth,
} from "@/contexts/CustomerAuthContext";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

const DISMISS_KEY = "googleOneTapDismissed";
const DISMISS_MS = 24 * 60 * 60 * 1000;

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

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "there";
}

function isDismissed(): boolean {
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
  const { isLoggedIn, loading: authLoading } = useCustomerAuth();
  const [gsiReady, setGsiReady] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hintName = "your Google account";
  const hintEmail = "google.com";
  const prompted = useRef(false);

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
      const data = await parseJsonResponse<{
        success?: boolean;
        error?: string;
        name?: string;
      }>(res);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Google sign-in failed");
      }
      localStorage.setItem("loginMethod", "google");
      setShowCard(false);
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
    if (
      skip ||
      authLoading ||
      isLoggedIn ||
      !gsiReady ||
      isDismissed() ||
      prompted.current
    ) {
      return;
    }

    const id = window.google?.accounts?.id;
    if (!id) {
      setShowCard(true);
      return;
    }

    prompted.current = true;

    id.initialize({
      client_id: clientId,
      callback: (res) => {
        if (res.credential) {
          void finishLogin(res.credential);
        }
      },
      auto_select: true,
      cancel_on_tap_outside: false,
      context: "signin",
      itp_support: true,
    });

    id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        setShowCard(true);
      }
    });
  }, [skip, authLoading, isLoggedIn, gsiReady, clientId, finishLogin]);

  if (skip || authLoading || isLoggedIn || isDismissed()) {
    return null;
  }

  const continueLabel =
    hintName !== "your Google account"
      ? `Continue as ${firstName(hintName)}`
      : "Continue with Google";

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiReady(true)}
      />

      <div id="google-one-tap-anchor" className="google-one-tap-anchor" />

      {showCard ? (
        <aside
          className="google-one-tap-fallback"
          role="dialog"
          aria-label="Sign in with Google"
        >
          <div className="google-one-tap-fallback__header">
            <GoogleLogo />
            <p className="google-one-tap-fallback__title">
              Sign in to {siteName} with google.com
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
            <p className="mb-2 text-center text-xs text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            className="google-one-tap-fallback__cta"
            disabled={loading}
            onClick={openPopup}
          >
            {loading ? "Signing in…" : continueLabel}
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
