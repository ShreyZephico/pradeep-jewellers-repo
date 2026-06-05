"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import ModalPortal from "@/components/ModalPortal";
import { markCouponPopupClaimed, markCouponPopupDismissed } from "@/lib/couponPopupStorage";

import "./coupon-popup.css";

type Props = {
  sourcePage: string;
  onClose: () => void;
};

type ViewState = "form" | "success" | "duplicate";

export default function CouponPopup({ sourcePage, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>("form");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    emailRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        markCouponPopupDismissed();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleClose = useCallback(() => {
    markCouponPopupDismissed();
    onClose();
  }, [onClose]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/coupon-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source_page: sourcePage,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        duplicate?: boolean;
        message?: string;
        error?: string;
      };

      if (data.duplicate) {
        markCouponPopupClaimed();
        setView("duplicate");
        setSuccessMessage(
          data.message ??
            "You have already claimed this offer. New coupon codes will be available soon."
        );
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not submit. Please try again.");
        return;
      }

      markCouponPopupClaimed();
      setSuccessMessage(
        data.message ??
          "Your coupon code will reach you by email shortly! Check your inbox within a few minutes."
      );
      setView("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalPortal>
      <div
        className="coupon-popup__backdrop"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            handleClose();
          }
        }}
      >
        <div
          ref={dialogRef}
          className="coupon-popup__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-popup-title"
          aria-describedby="coupon-popup-desc"
        >
          <div className="coupon-popup__glow" aria-hidden />
          <button
            type="button"
            className="coupon-popup__close"
            aria-label="Close offer popup"
            onClick={handleClose}
          >
            ×
          </button>

          <div className="coupon-popup__body">
            {view === "form" ? (
              <>
                <p className="coupon-popup__badge">
                  <span aria-hidden>✨</span> Limited-time offer
                </p>
                <h2 id="coupon-popup-title" className="coupon-popup__title">
                  Get <span className="coupon-popup__title-accent">10% OFF</span> on
                  Making Charges
                </h2>
                <p id="coupon-popup-desc" className="coupon-popup__description">
                  Unlock an exclusive jewellery discount — enter your email and we&apos;ll
                  send your coupon code straight to your inbox. No spam, just savings 💎
                </p>
                <ul className="coupon-popup__benefits">
                  <li>
                    <span aria-hidden>🎁</span>
                    <span>Instant coupon code delivered by email</span>
                  </li>
                  <li>
                    <span aria-hidden>💍</span>
                    <span>Valid on custom &amp; ready-made gold pieces</span>
                  </li>
                  <li>
                    <span aria-hidden>🔒</span>
                    <span>Your email stays private — unsubscribe anytime</span>
                  </li>
                </ul>

                <form className="coupon-popup__form" onSubmit={onSubmit}>
                  <label className="coupon-popup__label" htmlFor="coupon-popup-email">
                    Email address
                  </label>
                  <input
                    ref={emailRef}
                    id="coupon-popup-email"
                    className="coupon-popup__input"
                    type="email"
                    name="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    disabled={loading}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  {error ? (
                    <p className="coupon-popup__message coupon-popup__message--error" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button
                    className="coupon-popup__submit"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Sending… ✨" : "Claim My 10% OFF ✨"}
                  </button>
                  <p className="coupon-popup__hint">
                    📧 One offer per email · Works on your next purchase
                  </p>
                </form>
              </>
            ) : null}

            {view === "success" ? (
              <div className="coupon-popup__success-panel">
                <div className="coupon-popup__success-icon" aria-hidden>
                  🎉
                </div>
                <h2 id="coupon-popup-title" className="coupon-popup__success-title">
                  You&apos;re in!
                </h2>
                <p className="coupon-popup__success-text">{successMessage}</p>
                <button
                  type="button"
                  className="coupon-popup__submit"
                  style={{ marginTop: "1.15rem", width: "100%" }}
                  onClick={handleClose}
                >
                  Continue shopping ✨
                </button>
              </div>
            ) : null}

            {view === "duplicate" ? (
              <div className="coupon-popup__success-panel">
                <div className="coupon-popup__success-icon" aria-hidden>
                  💌
                </div>
                <h2 id="coupon-popup-title" className="coupon-popup__success-title">
                  Already claimed
                </h2>
                <p
                  className="coupon-popup__message coupon-popup__message--info"
                  role="status"
                >
                  {successMessage}
                </p>
                <button
                  type="button"
                  className="coupon-popup__submit"
                  style={{ marginTop: "1.15rem", width: "100%" }}
                  onClick={handleClose}
                >
                  Got it
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
