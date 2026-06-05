"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import ModalPortal from "@/components/ModalPortal";
import { notifyAuthChanged } from "@/contexts/CustomerAuthContext";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

import "@/styles/profile.css";

type Props = {
  hasPassword: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export default function ProfilePasswordModal({
  hasPassword,
  onClose,
  onSuccess,
}: Props) {
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = hasPassword ? "Update password" : "Add password";
  const titleId = "profile-password-modal-title";
  const descId = "profile-password-modal-desc";

  useEffect(() => {
    firstFieldRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (hasPassword && !currentPassword.trim()) {
      setError("Enter your current password.");
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, string> = { password };
      if (hasPassword) {
        payload.currentPassword = currentPassword;
      }

      const response = await fetch("/api/customer/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse<{
        success?: boolean;
        hasPassword?: boolean;
        error?: string;
      }>(response);

      if (!data?.success) {
        throw new Error(data?.error || "Could not save password.");
      }

      if (data.hasPassword) {
        localStorage.setItem("loginMethod", "email");
      }

      notifyAuthChanged();
      onSuccess(
        hasPassword
          ? "Password updated successfully."
          : "Password added. You can now sign in with email too."
      );
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalPortal>
      <div
        className="profile-modal__backdrop"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className="profile-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <span className="profile-modal__glow" aria-hidden />
          <button
            type="button"
            className="profile-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>

          <div className="profile-modal__body">
            <div className="profile-modal__head">
              <p className="profile-modal__badge">Account security</p>
              <h2 id={titleId} className="profile-modal__title">
                {title}
              </h2>
              <p id={descId} className="profile-modal__desc">
                {hasPassword
                  ? "Enter your current password, then choose a new one."
                  : "Create a password for your account so you can also sign in with email."}
              </p>
            </div>

            {error ? (
              <p className="profile-alert profile-alert--error" role="alert">
                {error}
              </p>
            ) : null}

            <form className="profile-form profile-form--modal" onSubmit={handleSubmit} noValidate>
            {hasPassword ? (
              <div className="profile-field profile-field--full">
                <label htmlFor="modal-current-password">Current password</label>
                <input
                  ref={firstFieldRef}
                  id="modal-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            ) : null}

            <div className="profile-field profile-field--full">
              <label htmlFor="modal-new-password">
                {hasPassword ? "New password" : "Password"}
              </label>
              <input
                ref={hasPassword ? undefined : firstFieldRef}
                id="modal-new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <div className="profile-field profile-field--full">
              <label htmlFor="modal-confirm-password">Confirm password</label>
              <input
                id="modal-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <div className="profile-modal__actions">
              <button
                type="button"
                className="profile-btn profile-btn--secondary profile-modal__btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="profile-btn profile-btn--primary profile-modal__btn-submit"
                disabled={loading}
              >
                {loading
                  ? "Saving…"
                  : hasPassword
                    ? "Update password"
                    : "Add password"}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
