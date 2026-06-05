"use client";

import { useState } from "react";

import AccountShell from "@/components/profile/AccountShell";
import {
  addressToForm,
  EMPTY_ADDRESS,
  formatAddress,
  type AddressFormState,
  type CustomerAddress,
} from "@/components/profile/profileShared";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

export default function ProfileAddressesClient() {
  const { profile, setProfile, loading, error: loadError } = useCustomerProfile();

  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] =
    useState<AddressFormState>(EMPTY_ADDRESS);

  function openNewAddressForm() {
    setEditingAddressId(null);
    setAddressForm(addressToForm(null, profile));
    setAddressError(null);
    setAddressMessage(null);
    setShowAddressForm(true);
  }

  function openEditAddressForm(address: CustomerAddress) {
    setEditingAddressId(address.id);
    setAddressForm(addressToForm(address, profile));
    setAddressError(null);
    setAddressMessage(null);
    setShowAddressForm(true);
  }

  function closeAddressForm() {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS);
  }

  async function saveAddress(event: React.FormEvent) {
    event.preventDefault();
    setAddressSaving(true);
    setAddressError(null);
    setAddressMessage(null);

    try {
      const response = await fetch("/api/customer/addresses", {
        method: editingAddressId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAddressId ?? undefined,
          ...addressForm,
        }),
      });

      const data = await parseJsonResponse<{
        success?: boolean;
        profile?: typeof profile;
        error?: string;
      }>(response);

      if (!data?.success || !data.profile) {
        throw new Error(data?.error || "Could not save address.");
      }

      setProfile(data.profile);
      setAddressMessage(
        editingAddressId ? "Address updated." : "Address added."
      );
      closeAddressForm();
    } catch (saveError) {
      setAddressError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save address."
      );
    } finally {
      setAddressSaving(false);
    }
  }

  async function removeAddress(id: string) {
    if (!window.confirm("Delete this address from your Shopify account?")) {
      return;
    }

    setAddressSaving(true);
    setAddressError(null);
    setAddressMessage(null);

    try {
      const response = await fetch(
        `/api/customer/addresses?id=${encodeURIComponent(id)}`,
        { method: "DELETE", credentials: "include" }
      );

      const data = await parseJsonResponse<{
        success?: boolean;
        profile?: typeof profile;
        error?: string;
      }>(response);

      if (!data?.success || !data.profile) {
        throw new Error(data?.error || "Could not delete address.");
      }

      setProfile(data.profile);
      setAddressMessage("Address removed.");
      if (editingAddressId === id) closeAddressForm();
    } catch (deleteError) {
      setAddressError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete address."
      );
    } finally {
      setAddressSaving(false);
    }
  }

  async function makeDefaultAddress(addressId: string) {
    setAddressSaving(true);
    setAddressError(null);

    try {
      const response = await fetch("/api/customer/addresses/default", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId }),
      });

      const data = await parseJsonResponse<{
        success?: boolean;
        profile?: typeof profile;
        error?: string;
      }>(response);

      if (!data?.success || !data.profile) {
        throw new Error(data?.error || "Could not set default address.");
      }

      setProfile(data.profile);
      setAddressMessage("Default address updated.");
    } catch (defaultError) {
      setAddressError(
        defaultError instanceof Error
          ? defaultError.message
          : "Could not set default address."
      );
    } finally {
      setAddressSaving(false);
    }
  }

  return (
    <AccountShell
      active="addresses"
      pageTitle="Saved addresses"
      pageSubtitle="Manage delivery addresses for faster checkout."
      breadcrumbLabel="Addresses"
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
            <h2 className="profile-card__title">Your addresses</h2>
            <p className="profile-card__hint">
              Add, edit, or remove delivery addresses in Shopify.
            </p>
          </div>
          <button
            type="button"
            className="profile-btn profile-btn--secondary"
            onClick={openNewAddressForm}
            disabled={addressSaving}
          >
            Add address
          </button>
        </div>

        {addressError ? (
          <p className="profile-alert profile-alert--error" role="alert">
            {addressError}
          </p>
        ) : null}
        {addressMessage ? (
          <p className="profile-alert profile-alert--success" role="status">
            {addressMessage}
          </p>
        ) : null}

        {showAddressForm ? (
          <form
            className="profile-form profile-form--spaced"
            onSubmit={saveAddress}
          >
            <div className="profile-form__row">
              <div className="profile-field">
                <label htmlFor="addr-first-name">First name</label>
                <input
                  id="addr-first-name"
                  value={addressForm.firstName}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="profile-field">
                <label htmlFor="addr-last-name">Last name</label>
                <input
                  id="addr-last-name"
                  value={addressForm.lastName}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="profile-field profile-field--full">
              <label htmlFor="addr-line1">Address line 1</label>
              <input
                id="addr-line1"
                value={addressForm.address1}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    address1: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="profile-field profile-field--full">
              <label htmlFor="addr-line2">Address line 2</label>
              <input
                id="addr-line2"
                value={addressForm.address2}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    address2: event.target.value,
                  }))
                }
              />
            </div>

            <div className="profile-form__row">
              <div className="profile-field">
                <label htmlFor="addr-city">City</label>
                <input
                  id="addr-city"
                  value={addressForm.city}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="profile-field">
                <label htmlFor="addr-province">State</label>
                <input
                  id="addr-province"
                  value={addressForm.province}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      province: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="profile-form__row">
              <div className="profile-field">
                <label htmlFor="addr-zip">PIN code</label>
                <input
                  id="addr-zip"
                  value={addressForm.zip}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      zip: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="profile-field">
                <label htmlFor="addr-country">Country</label>
                <input
                  id="addr-country"
                  value={addressForm.country}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      country: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="profile-field profile-field--full">
              <label htmlFor="addr-phone">Phone</label>
              <input
                id="addr-phone"
                type="tel"
                value={addressForm.phone}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
              />
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="profile-btn profile-btn--primary"
                disabled={addressSaving}
              >
                {addressSaving
                  ? "Saving…"
                  : editingAddressId
                    ? "Update address"
                    : "Save address"}
              </button>
              <button
                type="button"
                className="profile-btn profile-btn--secondary"
                onClick={closeAddressForm}
                disabled={addressSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="profile-address-list">
          {profile?.addresses.length ? (
            profile.addresses.map((address) => {
              const isDefault = profile.defaultAddress?.id === address.id;
              return (
                <article
                  key={address.id}
                  className={`profile-address${isDefault ? " is-default" : ""}`}
                >
                  <div className="profile-address__top">
                    <h3 className="profile-address__name">
                      {[address.firstName, address.lastName]
                        .filter(Boolean)
                        .join(" ") || "Address"}
                    </h3>
                    {isDefault ? (
                      <span className="profile-address__badge">Default</span>
                    ) : null}
                  </div>
                  <p className="profile-address__text">
                    {formatAddress(address)
                      .split("\n")
                      .map((line, index) => (
                        <span key={`${address.id}-${index}`}>
                          {line}
                          <br />
                        </span>
                      ))}
                  </p>
                  <div className="profile-address__actions">
                    {!isDefault ? (
                      <button
                        type="button"
                        className="profile-btn profile-btn--ghost"
                        onClick={() => makeDefaultAddress(address.id)}
                        disabled={addressSaving}
                      >
                        Set default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="profile-btn profile-btn--secondary"
                      onClick={() => openEditAddressForm(address)}
                      disabled={addressSaving}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="profile-btn profile-btn--danger"
                      onClick={() => removeAddress(address.id)}
                      disabled={addressSaving}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="profile-card__hint">
              No saved addresses yet. Add one for faster checkout.
            </p>
          )}
        </div>
      </section>
    </AccountShell>
  );
}
