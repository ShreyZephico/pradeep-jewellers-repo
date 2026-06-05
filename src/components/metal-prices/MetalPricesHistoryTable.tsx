"use client";

import { useCallback, useEffect, useState } from "react";

import { METAL_PRICES_HISTORY_DAYS } from "@/lib/metalPricesAdminConfig";
import type { StoreMetalHistoryDayRow } from "@/lib/storeMetalPricesHistory";

function formatMoney(n: number | null) {
  if (n == null) return "—";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

type Props = {
  refreshKey?: number;
};

export default function MetalPricesHistoryTable({ refreshKey = 0 }: Props) {
  const [days, setDays] = useState(METAL_PRICES_HISTORY_DAYS);
  const [rows, setRows] = useState<StoreMetalHistoryDayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/metal-prices/history?days=${METAL_PRICES_HISTORY_DAYS}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Could not load history");
        setRows([]);
        return;
      }
      setDays(typeof json.days === "number" ? json.days : METAL_PRICES_HISTORY_DAYS);
      setRows(Array.isArray(json.rows) ? json.rows : []);
    } catch {
      setError("Could not load history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <section
      className="metal-prices-card metal-prices-history"
      aria-labelledby="history-title"
      aria-busy={loading}
    >
      <div className="metal-prices-card__head">
        <span className="metal-prices-card__icon" aria-hidden="true">
          Hist
        </span>
        <div>
          <h2 id="history-title" className="metal-prices-card__title">
            Saved price history
          </h2>
          <p className="metal-prices-card__hint">
            Last {days} day{days === 1 ? "" : "s"} (IST) — latest 24K, 22K, 14K, 9K, 18K,
            and silver per day.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="metal-prices-ref-skeleton" aria-hidden="true">
          <div className="metal-prices-ref-skeleton__bar" />
          <div className="metal-prices-ref-skeleton__bar" />
          <div className="metal-prices-ref-skeleton__bar" />
        </div>
      ) : error ? (
        <div className="metal-prices-gm__error">
          <p>{error}</p>
          <button type="button" className="metal-prices-gm__retry" onClick={load}>
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="metal-prices-card__hint">
          No saved prices in the last {days} days. Save all four rates above to see
          history here.
        </p>
      ) : (
        <div className="metal-prices-history__scroll">
          <table className="metal-prices-history__table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">24K / g</th>
                <th scope="col">22K / g</th>
                <th scope="col">14K / g</th>
                <th scope="col">9K / g</th>
                <th scope="col">18K / g</th>
                <th scope="col">Silver / 1 kg</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date}>
                  <th scope="row" className="metal-prices-history__date">
                    {row.dateLabel}
                  </th>
                  <td>{row.timeLabel}</td>
                  <td className="metal-prices-history__price">
                    {formatMoney(row.gold24)}
                  </td>
                  <td className="metal-prices-history__price">
                    {formatMoney(row.gold22)}
                  </td>
                  <td className="metal-prices-history__price">
                    {formatMoney(row.gold14)}
                  </td>
                  <td className="metal-prices-history__price">
                    {formatMoney(row.gold9)}
                  </td>
                  <td className="metal-prices-history__price">
                    {formatMoney(row.gold18)}
                  </td>
                  <td className="metal-prices-history__price">
                    {formatMoney(row.silver1kg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
