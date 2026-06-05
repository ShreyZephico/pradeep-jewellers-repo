"use client";

import { formatInr, formatPercentChange } from "@/lib/goldRates";

import { RATES_PAGE_COPY } from "@/components/rates-page/content";

import type { RatesTableRow } from "@/types/goldRate";

type Props = {
  rows: RatesTableRow[];
  showGold: boolean;
  showGold14: boolean;
  showGold9: boolean;
  showSilver: boolean;
};

function ChangeCell({ value }: { value?: number }) {
  if (value == null) return <span className="rates-table__na">—</span>;
  const cls =
    value > 0
      ? "rates-table__up"
      : value < 0
        ? "rates-table__down"
        : "rates-table__flat";
  return <span className={cls}>{formatPercentChange(value)}</span>;
}

export default function RatesComparisonTable({
  rows,
  showGold,
  showGold14,
  showGold9,
  showSilver,
}: Props) {
  const copy = RATES_PAGE_COPY.tableHeaders;
  const sorted = [...rows].reverse();

  return (
    <div className="rates-table-wrap">
      <p className="rates-table__scroll-hint" aria-hidden="true">
        Swipe sideways for full table
      </p>
      <div className="rates-table-scroll" tabIndex={0} role="region" aria-label="Daily rate comparison table">
        <table className="rates-table">
          <thead>
            <tr>
              <th className="rates-table__sticky-col">{copy.date}</th>
              {showGold ? <th>{copy.gold24k}</th> : null}
              {showGold ? <th>{copy.gold22k}</th> : null}
              {showGold14 ? <th>{copy.gold14k}</th> : null}
              {showGold9 ? <th>{copy.gold9k}</th> : null}
              {showSilver ? <th>{copy.silver}</th> : null}
              {showGold ? (
                <th className="rates-table__change-col">{copy.change} 24K</th>
              ) : null}
              {showGold ? (
                <th className="rates-table__change-col">{copy.change} 22K</th>
              ) : null}
              {showGold14 ? (
                <th className="rates-table__change-col">{copy.change} 14K</th>
              ) : null}
              {showGold9 ? (
                <th className="rates-table__change-col">{copy.change} 9K</th>
              ) : null}
              {showSilver ? (
                <th className="rates-table__change-col">{copy.change} Ag</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.date}>
                <td className="rates-table__date rates-table__sticky-col">
                  {row.dateLabel}
                </td>
                {showGold ? (
                  <td>
                    {row.gold24k != null
                      ? formatInr(row.gold24k, 2)
                      : "—"}
                  </td>
                ) : null}
                {showGold ? (
                  <td>
                    {row.gold22k != null
                      ? formatInr(row.gold22k, 2)
                      : "—"}
                  </td>
                ) : null}
                {showGold14 ? (
                  <td>
                    {row.gold14k != null
                      ? formatInr(row.gold14k, 2)
                      : "—"}
                  </td>
                ) : null}
                {showGold9 ? (
                  <td>
                    {row.gold9k != null
                      ? formatInr(row.gold9k, 2)
                      : "—"}
                  </td>
                ) : null}
                {showSilver ? (
                  <td>
                    {row.silver1kg != null
                      ? formatInr(row.silver1kg, 2)
                      : "—"}
                  </td>
                ) : null}
                {showGold ? (
                  <td className="rates-table__change-col">
                    <ChangeCell value={row.gold24kChange} />
                  </td>
                ) : null}
                {showGold ? (
                  <td className="rates-table__change-col">
                    <ChangeCell value={row.gold22kChange} />
                  </td>
                ) : null}
                {showGold14 ? (
                  <td className="rates-table__change-col">
                    <ChangeCell value={row.gold14kChange} />
                  </td>
                ) : null}
                {showGold9 ? (
                  <td className="rates-table__change-col">
                    <ChangeCell value={row.gold9kChange} />
                  </td>
                ) : null}
                {showSilver ? (
                  <td className="rates-table__change-col">
                    <ChangeCell value={row.silver1kgChange} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
