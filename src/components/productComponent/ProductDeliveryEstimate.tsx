"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Crosshair, MapPin, Package, Truck } from "lucide-react";

import { useDeliveryLocation } from "@/contexts/DeliveryLocationContext";
import productContent, { formatProductCopy } from "@/lib/productContent";
import {
  formatDeliveryDays,
  formatEstimatedDeliveryDate,
  isValidPincodeFormat,
  normalizePincodeInput,
  type PincodeLookupResult,
} from "@/lib/pincodeDelivery";

const copy = productContent.delivery;

type ProductDeliveryEstimateProps = {
  variant?: "full" | "compact";
};

function DeliveryResultCompact({
  result,
  resultId,
}: {
  result: PincodeLookupResult;
  resultId: string;
}) {
  return (
    <div
      id={resultId}
      className="product-delivery-compact__result"
      role="status"
      aria-live="polite"
    >
      <span className="product-delivery-compact__result-icon" aria-hidden>
        <Package size={18} strokeWidth={1.75} />
      </span>
      <div className="product-delivery-compact__result-body">
        <p className="product-delivery-compact__estimate">
          {formatProductCopy(
            result.isGujarat
              ? copy.compactEstimateGujarat
              : copy.compactEstimateIndia,
            {
              days: formatDeliveryDays(
                result.deliveryDaysMin,
                result.deliveryDaysMax
              ),
            }
          )}
        </p>
        <p className="product-delivery-compact__estimate-by">
          {formatProductCopy(copy.compactEstimateBy, {
            date: formatEstimatedDeliveryDate(result.deliveryDaysMin),
          })}
          {" – "}
          {formatEstimatedDeliveryDate(result.deliveryDaysMax)}
        </p>
        <p className="product-delivery-compact__location">
          {result.areaLabel}
          <span className="product-delivery-compact__pincode">
            {" "}
            · {result.pincode}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function ProductDeliveryEstimate({
  variant = "full",
}: ProductDeliveryEstimateProps) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const resultId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    pincode: sitePincode,
    status: siteLocationStatus,
    deliveryResult: siteDeliveryResult,
    updatePincode,
  } = useDeliveryLocation();

  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PincodeLookupResult | null>(null);

  const lookupPincode = useCallback(async (raw: string) => {
    const normalized = normalizePincodeInput(raw);
    setPincode(normalized);
    setError("");

    if (!isValidPincodeFormat(normalized)) {
      setError(copy.errorInvalid);
      return;
    }

    setLoading(true);
    try {
      const ok = await updatePincode(normalized);
      if (!ok) {
        setError(copy.errorInvalid);
        setResult(null);
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [updatePincode]);

  useEffect(() => {
    if (!sitePincode) {
      return;
    }
    setPincode(sitePincode);
    if (siteDeliveryResult?.pincode === sitePincode) {
      setResult(siteDeliveryResult);
    }
  }, [sitePincode, siteDeliveryResult]);

  useEffect(() => {
    if (variant !== "compact") {
      return;
    }
    if (!isValidPincodeFormat(pincode)) {
      return;
    }
    if (result?.pincode === pincode || loading || siteLocationStatus === "locating") {
      return;
    }

    const timer = window.setTimeout(() => {
      void lookupPincode(pincode);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [pincode, variant, result?.pincode, loading, siteLocationStatus, lookupPincode]);

  const locating = siteLocationStatus === "locating";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void lookupPincode(pincode);
  };

  const handleChangePincode = () => {
    setResult(null);
    setError("");
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const actionBusy = locating || loading;
  const actionLabel = locating
    ? copy.detectingLocation
    : loading
      ? copy.checking
      : result
        ? copy.changeButton
        : copy.checkButton;

  if (variant === "compact") {
    return (
      <div
        className="product-delivery product-delivery--compact"
        aria-labelledby={`${inputId}-compact-label`}
      >
        <p id={`${inputId}-compact-label`} className="product-delivery-compact__title">
          {copy.sidebarTitle ?? copy.title}
        </p>

        <form className="product-delivery-compact__form" onSubmit={handleSubmit} noValidate>
          <div
            className={`product-delivery-compact__field${
              error ? " product-delivery-compact__field--error" : ""
            }${locating ? " product-delivery-compact__field--locating" : ""}`}
          >
            <Crosshair
              size={18}
              strokeWidth={1.75}
              aria-hidden
              className="product-delivery-compact__field-icon"
            />
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={pincode}
              onChange={(event) => {
                setPincode(normalizePincodeInput(event.target.value));
                setError("");
                if (result && normalizePincodeInput(event.target.value) !== result.pincode) {
                  setResult(null);
                }
              }}
              placeholder={copy.pincodePlaceholder}
              className="product-delivery-compact__input"
              aria-invalid={Boolean(error)}
              aria-describedby={
                [error ? errorId : null, result ? resultId : null]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              disabled={actionBusy}
            />
            <button
              type={result ? "button" : "submit"}
              className="product-delivery-compact__action"
              onClick={result ? handleChangePincode : undefined}
              disabled={actionBusy || (!result && pincode.length < 6)}
            >
              {actionLabel}
            </button>
          </div>
        </form>

        {!result && !actionBusy && !error ? (
          <p className="product-delivery-compact__hint">{copy.locationHint}</p>
        ) : null}

        {error ? (
          <p id={errorId} className="product-delivery-compact__error" role="alert">
            {error}
          </p>
        ) : null}

        {result ? <DeliveryResultCompact result={result} resultId={resultId} /> : null}
      </div>
    );
  }

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
              disabled={actionBusy}
            />
            <button
              type="submit"
              className="product-delivery__submit"
              disabled={actionBusy || pincode.length < 6}
            >
              {actionLabel}
            </button>
          </div>
          <p id={hintId} className="product-delivery__hint">
            {locating ? copy.detectingLocation : copy.pincodeHint}
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
