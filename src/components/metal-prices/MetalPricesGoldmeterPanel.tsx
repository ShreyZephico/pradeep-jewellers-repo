"use client";

import { useCallback, useEffect, useState } from "react";

import type { GoldmeterTableRow } from "@/lib/goldmeterParse";

function formatMoney(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

type Props = {
  compare?: {
    gold24: string;
    gold22: string;
    gold14: string;
    gold9: string;
    gold18: string;
    silver1kg: string;
  };
};

export default function MetalPricesGoldmeterPanel({ compare }: Props) {
  const [table, setTable] = useState<GoldmeterTableRow[] | null>(null);
  const [silver1kg, setSilver1kg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/metal-prices/reference", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok || !Array.isArray(json.table)) {
        setError(json.error || "Could not load GoldMeter rates");
        setTable(null);
        setSilver1kg(null);
        return;
      }
      setTable(json.table);
      setSilver1kg(typeof json.silver1kg === "number" ? json.silver1kg : null);
    } catch {
      setError("Could not load GoldMeter rates");
      setTable(null);
      setSilver1kg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function refRowForMetal(key: string) {
    if (!table) return null;
    const lower = key.toLowerCase();
    return table.find((r) => {
      const m = r.metal.toLowerCase();
      if (lower === "silver") return m.includes("silver");
      return m.includes(lower);
    });
  }

  function diffHint(
    entered: string,
    refValue: number | null
  ): { text: string; tone: "same" | "up" | "down" } | null {
    const n = Number(entered);
    if (!Number.isFinite(n) || n <= 0 || refValue == null) return null;
    const diff = Math.round(n - refValue);
    if (diff === 0) return { text: "Matches GoldMeter", tone: "same" };
    if (diff > 0) return { text: `+${formatMoney(diff)} vs GoldMeter`, tone: "up" };
    return { text: `${formatMoney(diff)} vs GoldMeter`, tone: "down" };
  }

  return (
    <section
      className="metal-prices-gm"
      aria-labelledby="gm-title"
      aria-busy={loading}
    >
      <h2 id="gm-title" className="metal-prices-gm__table-title">
        Today&apos;s Gold &amp; Silver Rates in Ahmedabad
      </h2>
      <p className="metal-prices-gm__source">Reference: GoldMeter.in</p>

      {loading ? (
        <div className="metal-prices-ref-skeleton" aria-hidden="true">
          <div className="metal-prices-ref-skeleton__bar" />
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
      ) : table ? (
        <>
          <div className="metal-prices-ref-table-wrap">
            <table className="metal-prices-ref-table">
              <thead>
                <tr>
                  <th>Metal</th>
                  <th>Purity</th>
                  <th>Rate per gram</th>
                  <th>Rate per 8g</th>
                  <th>Rate per 10g</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row) => (
                  <tr key={row.metal}>
                    <td>{row.metal}</td>
                    <td>{row.purity}</td>
                    <td className="metal-prices-ref-table__price">
                      {formatMoney(row.perGram)}
                    </td>
                    <td>{formatMoney(row.per8g)}</td>
                    <td>{formatMoney(row.per10g)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {silver1kg != null ? (
            <p className="metal-prices-ref-table__silver-kg">
              Silver (1 kg): <strong>{formatMoney(silver1kg)}</strong>
              <span className="metal-prices-ref-item__note">
                {" "}
                (₹/gram × 1,000)
              </span>
            </p>
          ) : null}

          {compare ? (
            <div className="metal-prices-gm__compare" aria-label="Your entries vs GoldMeter">
              <p className="metal-prices-gm__compare-title">Your draft vs reference</p>
              <ul className="metal-prices-gm__compare-list">
                {(
                  [
                    ["24K gold (per gram)", compare.gold24, refRowForMetal("24k")?.perGram ?? null],
                    ["22K gold (per gram)", compare.gold22, refRowForMetal("22k")?.perGram ?? null],
                    ["14K gold (per gram)", compare.gold14, null],
                    ["9K gold (per gram)", compare.gold9, null],
                    ["18K gold (per gram)", compare.gold18, refRowForMetal("18k")?.perGram ?? null],
                    ["Silver (1 kg)", compare.silver1kg, silver1kg],
                  ] as const
                ).map(([label, entered, refVal]) => {
                  const hint = diffHint(entered, refVal);
                  return (
                    <li key={label}>
                      <span>{label}</span>
                      <span>
                        {entered ? formatMoney(Number(entered)) : "—"}
                        {hint ? (
                          <em
                            className={`metal-prices-gm__diff metal-prices-gm__diff--${hint.tone}`}
                          >
                            {hint.text}
                          </em>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
