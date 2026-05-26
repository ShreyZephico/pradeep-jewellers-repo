/** Cartoon SVG scene — jewellery shop “lost treasure” theme */
export default function NotFoundIllustration() {
  return (
    <svg
      className="not-found__illustration-svg"
      viewBox="0 0 420 320"
      role="img"
      aria-labelledby="not-found-art-title"
    >
      <title id="not-found-art-title">
        Cartoon jeweller searching for a lost ring with floating gems
      </title>

      {/* Ground shadow */}
      <ellipse
        cx="210"
        cy="288"
        rx="140"
        ry="18"
        className="not-found__svg-shadow"
      />

      {/* Treasure chest */}
      <g className="not-found__svg-chest">
        <path
          d="M72 220 h96 v44 a12 12 0 0 1 -12 12 H84 a12 12 0 0 1 -12 -12 v-44z"
          fill="#8f6c32"
          stroke="#5c4520"
          strokeWidth="3"
        />
        <path
          d="M72 220 h96 v-28 a16 16 0 0 0 -16 -16 H88 a16 16 0 0 0 -16 16 v28z"
          fill="#c5a059"
          stroke="#5c4520"
          strokeWidth="3"
        />
        <rect x="108" y="198" width="24" height="28" rx="4" fill="#d4af37" />
        <path
          d="M108 210 q12 -18 24 0"
          fill="none"
          stroke="#5c4520"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text x="120" y="248" textAnchor="middle" className="not-found__svg-empty">
          ?
        </text>
      </g>

      {/* Character body */}
      <g className="not-found__svg-character">
        <circle cx="280" cy="118" r="36" fill="#ffe8d6" stroke="#2c2c2c" strokeWidth="3" />
        <circle cx="268" cy="112" r="5" fill="#2c2c2c" />
        <circle cx="292" cy="112" r="5" fill="#2c2c2c" />
        <path
          d="M272 128 q8 8 16 0"
          fill="none"
          stroke="#2c2c2c"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse cx="280" cy="108" rx="38" ry="8" fill="#153d41" opacity="0.9" />
        <path
          d="M248 154 h64 a20 20 0 0 1 20 20 v52 a8 8 0 0 1 -8 8 h-88 a8 8 0 0 1 -8 -8 v-52 a20 20 0 0 1 20 -20z"
          fill="#0a2b2e"
          stroke="#2c2c2c"
          strokeWidth="3"
        />
        <path
          d="M256 168 h48 v12 H256z"
          fill="#d4af37"
          opacity="0.85"
        />
        <circle cx="280" cy="200" r="6" fill="#d4af37" stroke="#5c4520" strokeWidth="2" />

        {/* Arm + magnifying glass */}
        <g className="not-found__svg-glass">
          <path
            d="M248 178 q-28 8 -36 32"
            fill="none"
            stroke="#ffe8d6"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="198" cy="218" r="28" fill="rgb(255 255 255 / 0.35)" stroke="#5c4520" strokeWidth="3" />
          <circle cx="198" cy="218" r="18" fill="rgb(212 175 55 / 0.15)" stroke="#a8813e" strokeWidth="2" />
          <line x1="218" y1="238" x2="238" y2="258" stroke="#5c4520" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Legs */}
        <path
          d="M262 234 v42 M298 234 v42"
          stroke="#2c2c2c"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <ellipse cx="262" cy="278" rx="14" ry="6" fill="#2c2c2c" />
        <ellipse cx="298" cy="278" rx="14" ry="6" fill="#2c2c2c" />
      </g>

      {/* Floating gems */}
      <g className="not-found__svg-gem not-found__svg-gem--1">
        <polygon
          points="340,72 352,96 328,96"
          fill="#e8b4b8"
          stroke="#2c2c2c"
          strokeWidth="2"
        />
        <polygon points="340,96 328,108 352,108" fill="#f9d4d8" stroke="#2c2c2c" strokeWidth="2" />
      </g>
      <g className="not-found__svg-gem not-found__svg-gem--2">
        <polygon
          points="48,88 60,112 36,112"
          fill="#d4af37"
          stroke="#5c4520"
          strokeWidth="2"
        />
        <polygon points="48,112 36,124 60,124" fill="#f5e6a8" stroke="#5c4520" strokeWidth="2" />
      </g>
      <g className="not-found__svg-gem not-found__svg-gem--3">
        <circle cx="360" cy="200" r="14" fill="#94a3b8" stroke="#2c2c2c" strokeWidth="2" />
        <circle cx="360" cy="200" r="6" fill="#e2e8f0" />
      </g>

      {/* Sparkles */}
      <g className="not-found__svg-sparkle not-found__svg-sparkle--a">
        <path d="M160 48 l6 12 l12 6 l-12 6 l-6 12 l-6 -12 l-12 -6 l12 -6z" fill="#d4af37" />
      </g>
      <g className="not-found__svg-sparkle not-found__svg-sparkle--b">
        <path d="M380 120 l4 8 l8 4 l-8 4 l-4 8 l-4 -8 l-8 -4 l8 -4z" fill="#d4af37" />
      </g>
      <g className="not-found__svg-sparkle not-found__svg-sparkle--c">
        <path d="M100 200 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5 l10 -5z" fill="#c5a059" />
      </g>

      {/* Question marks floating */}
      <text x="320" y="56" className="not-found__svg-q not-found__svg-q--1">
        ?
      </text>
      <text x="24" y="180" className="not-found__svg-q not-found__svg-q--2">
        ?
      </text>
    </svg>
  );
}
