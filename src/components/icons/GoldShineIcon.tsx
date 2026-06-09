"use client";

import { useId } from "react";

type GoldShineIconProps = {
  className?: string;
  title?: string;
};

/** Small shiny gold mark for weight / purity badges. */
export default function GoldShineIcon({
  className,
  title = "Gold",
}: GoldShineIconProps) {
  const id = useId().replace(/:/g, "");
  const shineId = `pj-gold-shine-${id}`;
  const glossId = `pj-gold-shine-gloss-${id}`;

  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={shineId} x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff4c2" />
          <stop offset="38%" stopColor="#f0c85a" />
          <stop offset="72%" stopColor="#d4a017" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <linearGradient id={glossId} x1="8" y1="5" x2="14" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9.25" fill={`url(#${shineId})`} stroke="#a67c00" strokeWidth="1.1" />
      <ellipse cx="10.2" cy="9.1" rx="4.2" ry="2.5" fill={`url(#${glossId})`} transform="rotate(-18 10.2 9.1)" />
      <path
        d="M8.2 13.4h7.6c.5 0 .9.4.9.9v1.4c0 .5-.4.9-.9.9H8.2c-.5 0-.9-.4-.9-.9v-1.4c0-.5.4-.9.9-.9z"
        fill="#fff6d8"
        fillOpacity="0.55"
      />
    </svg>
  );
}
