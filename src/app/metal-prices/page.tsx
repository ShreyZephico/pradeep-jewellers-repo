"use client";

import { useCallback, useEffect, useState } from "react";

import MetalPricesGoldmeterPanel from "@/components/metal-prices/MetalPricesGoldmeterPanel";
import MetalPricesHistoryTable from "@/components/metal-prices/MetalPricesHistoryTable";

type Snackbar = {
  type: "success" | "error";
  text: string;
} | null;

export default function MetalPricesPage() {
  const [gold24, setGold24] = useState("");
  const [gold22, setGold22] = useState("");
  const [gold14, setGold14] = useState("");
  const [gold9, setGold9] = useState("");
  const [gold18, setGold18] = useState("");
  const [silver1kg, setSilver1kg] = useState("");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<Snackbar>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const showSnackbar = useCallback((type: "success" | "error", text: string) => {
    setSnackbar({ type, text });
    setSnackbarVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSnackbarVisible(true));
    });
  }, []);

  useEffect(() => {
    if (!snackbar) return;
    const hideTimer = window.setTimeout(() => setSnackbarVisible(false), 4000);
    const clearTimer = window.setTimeout(() => setSnackbar(null), 4400);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [snackbar]);

  function onGold24Change(value: string) {
    setGold24(value);
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) {
      setGold22(String(Math.round(n * 0.92 * 100) / 100));
      setGold14(String(Math.round(n * 0.58 * 100) / 100));
      setGold9(String(Math.round(n * 0.38 * 100) / 100));
      setGold18(String(Math.round(n * 0.76 * 100) / 100));
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/metal-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gold24: Number(gold24),
          gold22: Number(gold22),
          gold14: Number(gold14),
          gold9: Number(gold9),
          gold18: Number(gold18),
          silver1kg: Number(silver1kg),
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        showSnackbar("error", json.error || "Save failed");
        return;
      }
      showSnackbar("success", "Prices saved successfully");
      setHistoryRefreshKey((k) => k + 1);
      setGold24("");
      setGold22("");
      setGold14("");
      setGold9("");
      setGold18("");
      setSilver1kg("");
    } catch {
      showSnackbar("error", "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputsDisabled = saving;

  return (
    <div className="metal-prices-page">
      {saving ? (
        <div className="metal-prices-overlay" role="alert" aria-busy="true" aria-live="polite">
          <div className="metal-prices-overlay__spinner" aria-hidden="true" />
          <p className="metal-prices-overlay__text">Saving prices to database…</p>
        </div>
      ) : null}

      {snackbar ? (
        <div
          className={`metal-prices-snackbar metal-prices-snackbar--${snackbar.type} ${
            snackbarVisible ? "metal-prices-snackbar--visible" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {snackbar.text}
        </div>
      ) : null}

      <header className="metal-prices-hero">
        <div className="metal-prices-hero__inner">
          <span className="metal-prices-hero__badge">Admin · Ahmedabad</span>
          <h1 className="metal-prices-hero__title">Today&apos;s Gold &amp; Silver Prices</h1>
          <p className="metal-prices-hero__subtitle">
            Compare live GoldMeter Ahmedabad rates on the left, enter your store prices on the
            right, then save to the database.
          </p>
        </div>
      </header>

      <div className="metal-prices-body">
        <div className="metal-prices-body__inner">
          <div className="metal-prices-grid">
            <MetalPricesGoldmeterPanel
              compare={{ gold24, gold22, gold14, gold9, gold18, silver1kg }}
            />

            <form
              className="metal-prices-card"
              onSubmit={onSave}
              aria-labelledby="form-title"
              autoComplete="off"
            >
              <div className="metal-prices-card__head">
                <span
                  className="metal-prices-card__icon metal-prices-card__icon--form"
                  aria-hidden="true"
                >
                  Add
                </span>
                <div>
                  <h2 id="form-title" className="metal-prices-card__title">
                    Your store prices
                  </h2>
                  <p className="metal-prices-card__hint">
                    All fields required. Saved with your email and mobile.
                  </p>
                </div>
              </div>

              <div className="metal-prices-form-grid">
                <label className="metal-prices-field">
                  <span className="metal-prices-field__label">24K gold (₹ / gram)</span>
                  <input
                    className="metal-prices-field__input"
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 15943"
                    value={gold24}
                    disabled={inputsDisabled}
                    autoComplete="off"
                    onChange={(e) => onGold24Change(e.target.value)}
                  />
                </label>

                <label className="metal-prices-field">
                  <span className="metal-prices-field__label">Silver (₹ / 1 kg)</span>
                  <input
                    className="metal-prices-field__input"
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 285000"
                    value={silver1kg}
                    disabled={inputsDisabled}
                    autoComplete="off"
                    onChange={(e) => setSilver1kg(e.target.value)}
                  />
                </label>

                <label className="metal-prices-field">
                  <span className="metal-prices-field__label">
                    22K gold (₹ / gram)
                    <span className="metal-prices-field__note">Auto: 24K × 0.92</span>
                  </span>
                  <input
                    className="metal-prices-field__input"
                    type="number"
                    step="0.01"
                    required
                    placeholder="Auto calculated"
                    value={gold22}
                    disabled={inputsDisabled}
                    autoComplete="off"
                    onChange={(e) => setGold22(e.target.value)}
                  />
                </label>

                <label className="metal-prices-field">
                  <span className="metal-prices-field__label">
                    14K gold (₹ / gram)
                    <span className="metal-prices-field__note">Auto: 24K × 0.58</span>
                  </span>
                  <input
                    className="metal-prices-field__input"
                    type="number"
                    step="0.01"
                    required
                    placeholder="Auto calculated"
                    value={gold14}
                    disabled={inputsDisabled}
                    autoComplete="off"
                    onChange={(e) => setGold14(e.target.value)}
                  />
                </label>

                <label className="metal-prices-field">
                  <span className="metal-prices-field__label">
                    9K gold (₹ / gram)
                    <span className="metal-prices-field__note">Auto: 24K × 0.38</span>
                  </span>
                  <input
                    className="metal-prices-field__input"
                    type="number"
                    step="0.01"
                    required
                    placeholder="Auto calculated"
                    value={gold9}
                    disabled={inputsDisabled}
                    autoComplete="off"
                    onChange={(e) => setGold9(e.target.value)}
                  />
                </label>

                <label className="metal-prices-field">
                  <span className="metal-prices-field__label">
                    18K gold (₹ / gram)
                    <span className="metal-prices-field__note">Auto: 24K × 0.76</span>
                  </span>
                  <input
                    className="metal-prices-field__input"
                    type="number"
                    step="0.01"
                    required
                    placeholder="Auto calculated"
                    value={gold18}
                    disabled={inputsDisabled}
                    autoComplete="off"
                    onChange={(e) => setGold18(e.target.value)}
                  />
                </label>

                <div className="metal-prices-field metal-prices-field--full">
                  <button className="metal-prices-submit" type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save to database"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <MetalPricesHistoryTable refreshKey={historyRefreshKey} />
        </div>
      </div>
    </div>
  );
}
