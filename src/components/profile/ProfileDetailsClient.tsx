"use client";

import { useEffect, useState } from "react";

import AccountShell from "@/components/profile/AccountShell";
import ProfilePasswordModal from "@/components/profile/ProfilePasswordModal";
import { displayName } from "@/components/profile/profileShared";
import { notifyAuthChanged, useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

export default function ProfileDetailsClient() {
  const { userName } = useCustomerAuth();
  const {
    profile,
    hasPassword,
    setHasPassword,
    loading,
    error: loadError,
  } = useCustomerProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setEmail(profile.email);
    setPhone(profile.phone ?? "");
    setAcceptsMarketing(Boolean(profile.acceptsMarketing));
  }, [profile]);

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/customer/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          acceptsMarketing,
        }),
      });

      const data = await parseJsonResponse<{
        success?: boolean;
        profile?: typeof profile;
        error?: string;
      }>(response);

      if (!data?.success || !data.profile) {
        throw new Error(data?.error || "Could not save profile.");
      }

      setMessage("Profile updated successfully.");
      notifyAuthChanged();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const name = profile ? displayName(profile) : userName || "My Profile";

  return (
    <>
      <AccountShell
        active="profile"
        pageTitle={name}
        pageSubtitle="Update your name, email, and contact preferences."
        breadcrumbLabel="Personal details"
        profile={profile}
        loading={loading}
      >
        {loadError ? (
          <p className="profile-alert profile-alert--error" role="alert">
            {loadError}
          </p>
        ) : null}

        <section className="profile-card">
          <div className="profile-card__head">
            <div>
              <h2 className="profile-card__title">Personal details</h2>
              <p className="profile-card__hint">
                Changes save directly to your Shopify customer account.
              </p>
            </div>
          </div>

          {error ? (
            <p className="profile-alert profile-alert--error" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="profile-alert profile-alert--success" role="status">
              {message}
            </p>
          ) : null}

          <form
            className="profile-form"
            onSubmit={(event) => {
              event.preventDefault();
              void saveProfile();
            }}
            noValidate
          >
            <div className="profile-form__row">
              <div className="profile-field">
                <label htmlFor="profile-first-name">First name</label>
                <input
                  id="profile-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="profile-field">
                <label htmlFor="profile-last-name">Last name</label>
                <input
                  id="profile-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="profile-form__row">
              <div className="profile-field">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="profile-field">
                <label htmlFor="profile-phone">Phone</label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <label className="profile-check">
              <input
                type="checkbox"
                checked={acceptsMarketing}
                onChange={(event) => setAcceptsMarketing(event.target.checked)}
              />
              <span>Send me offers and jewellery updates by email.</span>
            </label>

            <div className="profile-password-row">
              <div>
                <h3 className="profile-password-row__title">Password</h3>
                <p className="profile-card__hint">
                  {hasPassword
                    ? "Your account has a password for email sign-in."
                    : "No password yet — add one to sign in with email too."}
                </p>
              </div>
              <button
                type="button"
                className="profile-btn profile-btn--secondary"
                onClick={() => setShowPasswordModal(true)}
              >
                {hasPassword ? "Update password" : "Add password"}
              </button>
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="profile-btn profile-btn--primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      </AccountShell>

      {showPasswordModal ? (
        <ProfilePasswordModal
          hasPassword={hasPassword}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={(successMessage) => {
            setHasPassword(true);
            setMessage(successMessage);
            setError(null);
          }}
        />
      ) : null}
    </>
  );
}
