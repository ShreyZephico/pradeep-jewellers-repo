"use client";

import { useCallback, useId, useState, type FormEvent } from "react";
import { MapPin, Package, Truck } from "lucide-react";

import productContent, { formatProductCopy } from "@/lib/productContent";
import {
  fetchPincodeLookup,
  formatDeliveryDays,
  isValidPincodeFormat,
  normalizePincodeInput,
  type PincodeLookupResult,
} from "@/lib/pincodeDelivery";

const copy = productContent.delivery;

export default function ProductDeliveryEstimate() {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const resultId = useId();

  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PincodeLookupResult | null>(null);

  const checkDelivery = useCallback(async () => {
    const normalized = normalizePincodeInput(pincode);
    setPincode(normalized);
    setError("");
    setResult(null);

    if (!isValidPincodeFormat(normalized)) {
      setError(copy.errorInvalid);
      return;
    }

    setLoading(true);
    try {
      const lookup = await fetchPincodeLookup(normalized);
      if ("code" in lookup) {
        setError(lookup.message);
        return;
      }
      setResult(lookup);
    } finally {
      setLoading(false);
    }
  }, [pincode]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void checkDelivery();
  };

  return (
    <section
      className="product-delivery"
      aria-labelledby="product-delivery-title"
    >
      <div className="product-delivery__inner">
        <header className="product-delivery__header">
          <span className="product-delivery__icon-wrap" aria-hidden>
            <Truck size={22} strokeWidth={1.75} />
          </span>
          <div className="product-delivery__intro">
            <h2 id="product-delivery-title" className="product-delivery__title">
              {copy.title}
            </h2>
            <p className="product-delivery__subtitle">{copy.subtitle}</p>
          </div>
        </header>

        <form className="product-delivery__form" onSubmit={handleSubmit} noValidate>
          <label className="product-delivery__label" htmlFor={inputId}>
            {copy.pincodeLabel}
          </label>
          <div className="product-delivery__controls">
            <input
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={pincode}
              onChange={(event) => {
                setPincode(normalizePincodeInput(event.target.value));
                setError("");
              }}
              placeholder={copy.pincodePlaceholder}
              className={`product-delivery__input${
                error ? " product-delivery__input--error" : ""
              }`}
              aria-invalid={Boolean(error)}
              aria-describedby={
                [hintId, error ? errorId : null, result ? resultId : null]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              disabled={loading}
            />
            <button
              type="submit"
              className="product-delivery__submit"
              disabled={loading || pincode.length < 6}
            >
              {loading ? copy.checking : copy.checkButton}
            </button>
          </div>
          <p id={hintId} className="product-delivery__hint">
            {copy.pincodeHint}
          </p>
        </form>

        {error ? (
          <p id={errorId} className="product-delivery__error" role="alert">
            {error}
          </p>
        ) : null}

        {result ? (
          <div
            id={resultId}
            className="product-delivery__result"
            role="status"
            aria-live="polite"
          >
            <div className="product-delivery__location">
              <MapPin size={18} aria-hidden className="product-delivery__location-icon" />
              <div className="product-delivery__location-text">
                <p className="product-delivery__location-label">{copy.locationLabel}</p>
                <p className="product-delivery__location-value">{result.areaLabel}</p>
                <p className="product-delivery__pincode-ref">
                  {formatProductCopy(copy.pincodeRef, { pincode: result.pincode })}
                </p>
              </div>
            </div>

            <div className="product-delivery__estimate">
              <span className="product-delivery__estimate-icon-wrap" aria-hidden>
                <Package size={18} strokeWidth={1.75} />
              </span>
              <div className="product-delivery__estimate-body">
                <p className="product-delivery__estimate-label">{copy.estimateLabel}</p>
                <p className="product-delivery__estimate-value">
                  {formatDeliveryDays(result.deliveryDaysMin, result.deliveryDaysMax)}
                </p>
                <p className="product-delivery__estimate-region">
                  {formatProductCopy(copy.estimateRegion, {
                    region: result.deliveryRegionLabel,
                  })}
                </p>
              </div>
            </div>

            <p className="product-delivery__disclaimer">{copy.disclaimer}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
