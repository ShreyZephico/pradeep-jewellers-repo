"use client";

import { useId, useMemo } from "react";

import { formatChartDay } from "@/lib/goldRates";

import type { MetalRateHistoryPoint } from "@/types/goldRate";

export type ChartLine = {
  key: string;
  color: string;
  fill: string;
  points: MetalRateHistoryPoint[];
};

type Props = {
  lines: ChartLine[];
  animate?: boolean;
  heightClass?: string;
};

const W = 440;
const H = 200;
const PAD = { top: 18, right: 14, bottom: 34, left: 14 };

function gradientId(base: string, key: string): string {
  const slug = key.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
  return `${base}-${slug || "series"}`;
}

export default function RatesAnalyticsChart({
  lines,
  animate = true,
}: Props) {
  const gradientBase = useId().replace(/:/g, "");

  const geometry = useMemo(() => {
    const allPrices = lines.flatMap((l) => l.points.map((p) => p.price));
    if (!allPrices.length) return null;

    const rawMin = Math.min(...allPrices);
    const rawMax = Math.max(...allPrices);
    const span = rawMax - rawMin || rawMax * 0.02 || 1;
    const min = rawMin - span * 0.1;
    const max = rawMax + span * 0.1;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const dates = lines[0]?.points.map((p) => p.date) ?? [];
    const dateIndex = new Map(dates.map((d, i) => [d, i]));

    const builtLines = lines.map((line) => {
      const coords = line.points.map((point) => {
        const index = dateIndex.get(point.date) ?? 0;
        const x =
          PAD.left +
          (dates.length === 1
            ? innerW / 2
            : (index / Math.max(1, dates.length - 1)) * innerW);
        const y =
          PAD.top + innerH - ((point.price - min) / (max - min)) * innerH;
        return { x, y, point };
      });

      const linePath = coords
        .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
        .join(" ");

      const areaPath =
        coords.length > 0
          ? `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${(PAD.top + innerH).toFixed(2)} L ${coords[0].x.toFixed(2)} ${(PAD.top + innerH).toFixed(2)} Z`
          : "";

      return { ...line, coords, linePath, areaPath };
    });

    const gridYs = [0.25, 0.5, 0.75].map((t) => PAD.top + innerH * (1 - t));

    return { builtLines, gridYs, dates, min, max };
  }, [lines]);

  if (!geometry) {
    return <div className="rates-chart rates-chart--empty">No data</div>;
  }

  return (
    <div className="rates-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="rates-chart__svg"
        role="img"
        aria-label="Price trend chart"
      >
        <defs>
          {geometry.builtLines.map((line) => {
            const gradId = gradientId(gradientBase, line.key);
            return (
              <linearGradient
                key={line.key}
                id={gradId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={line.fill} stopOpacity="0.9" />
                <stop offset="100%" stopColor={line.fill} stopOpacity="0" />
              </linearGradient>
            );
          })}
        </defs>

        {geometry.gridYs.map((y) => (
          <line
            key={y}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y}
            y2={y}
            className="rates-chart__grid-line"
          />
        ))}

        {geometry.builtLines.map((line) => {
          const gradId = gradientId(gradientBase, line.key);
          return (
          <g key={line.key}>
            {line.areaPath ? (
              <path
                d={line.areaPath}
                fill={`url(#${gradId})`}
              />
            ) : null}
            <path
              d={line.linePath}
              fill="none"
              stroke={line.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                animate
                  ? "rates-chart__line rates-chart__line--animate"
                  : "rates-chart__line"
              }
            />
            {line.coords.map(({ x, y, point }) => (
              <circle
                key={`${line.key}-${point.date}`}
                cx={x}
                cy={y}
                r="3.5"
                fill="#ffffff"
                stroke={line.color}
                strokeWidth="2"
              />
            ))}
          </g>
          );
        })}
      </svg>

      <div className="rates-chart__labels">
        {geometry.dates.map((date) => (
          <span key={date} className="rates-chart__label">
            {formatChartDay(date)}
          </span>
        ))}
      </div>

      <div className="rates-chart__legend">
        {lines.map((line) => (
          <span key={line.key} className="rates-chart__legend-item">
            <span
              className="rates-chart__legend-swatch"
              style={{ background: line.color }}
            />
            {line.key}
          </span>
        ))}
      </div>
    </div>
  );
}
