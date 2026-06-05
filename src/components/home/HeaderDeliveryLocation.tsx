"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Crosshair, Pencil } from "lucide-react";

import { useDeliveryLocation } from "@/contexts/DeliveryLocationContext";
import productContent, { formatProductCopy } from "@/lib/productContent";
import {
  isValidPincodeFormat,
  normalizePincodeInput,
} from "@/lib/pincodeDelivery";

const copy = productContent.delivery;

export default function HeaderDeliveryLocation() {
  const panelId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const {
    pincode,
    districtLabel,
    deliveryDaysLabel,
    status,
    lookupLoading,
    updatePincode,
  } = useDeliveryLocation();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [draftPincode, setDraftPincode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pincode) {
      setDraftPincode(pincode);
    }
  }, [pincode]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!mounted || !pincode || status !== "ready") {
    return null;
  }

  const handleSubmit = async () => {
    const normalized = normalizePincodeInput(draftPincode);
    setDraftPincode(normalized);
    setError("");

    if (!isValidPincodeFormat(normalized)) {
      setError(copy.errorInvalid);
      return;
    }

    const ok = await updatePincode(normalized);
    if (!ok) {
      setError(copy.errorInvalid);
      return;
    }

    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`site-header__delivery${open ? " site-header__delivery--open" : ""}`}
    >
      <button
        type="button"
        className="site-header__delivery-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${copy.locationLabel} ${pincode}`}
      >
        {districtLabel ? (
          <span className="site-header__delivery-store">
            {formatProductCopy(copy.headerStoreLabel, { area: districtLabel })}
          </span>
        ) : null}
        <span className="site-header__delivery-line">
          <span className="site-header__delivery-label">{copy.locationLabel}</span>
          <span className="site-header__delivery-pin">{pincode}</span>
          <Pencil size={12} strokeWidth={2} aria-hidden className="site-header__delivery-edit" />
        </span>
      </button>

      {open ? (
        <div id={panelId} className="site-header__delivery-panel" role="dialog">
          <p className="site-header__delivery-panel-title">
            {copy.headerPincodeUnlockTitle}
          </p>
          <p className="site-header__delivery-panel-text">
            {copy.headerPincodeUnlockBody}
          </p>

          {deliveryDaysLabel ? (
            <p className="site-header__delivery-panel-days">
              {formatProductCopy(copy.headerDeliveryDays, {
                days: deliveryDaysLabel,
              })}
            </p>
          ) : null}

          <div
            className={`site-header__delivery-field${
              error ? " site-header__delivery-field--error" : ""
            }`}
          >
            <Crosshair size={16} strokeWidth={1.75} aria-hidden />
            <input
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={draftPincode}
              onChange={(event) => {
                setDraftPincode(normalizePincodeInput(event.target.value));
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              className="site-header__delivery-input"
              disabled={lookupLoading}
            />
            <button
              type="button"
              className="site-header__delivery-change"
              onClick={() => void handleSubmit()}
              disabled={lookupLoading || draftPincode.length < 6}
            >
              {lookupLoading ? copy.checking : copy.changeButton}
            </button>
          </div>

          {error ? (
            <p className="site-header__delivery-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
