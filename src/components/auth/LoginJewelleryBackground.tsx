/** Decorative jewellery SVG icons — no raster images */

function DiamondIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <path
        className="login-jewel__shape"
        d="M32 6 L54 26 L32 58 L10 26 Z"
      />
      <path
        className="login-jewel__shape"
        fill="none"
        d="M10 26 L32 26 L54 26 M32 26 L32 58"
      />
      <path
        className="login-jewel__shape"
        fill="none"
        d="M18 26 L32 6 L46 26"
      />
    </svg>
  );
}

function RingIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <ellipse
        className="login-jewel__shape"
        cx="32"
        cy="38"
        rx="20"
        ry="16"
        fill="none"
      />
      <path className="login-jewel__shape" d="M24 20 L32 8 L40 20 Z" />
      <path
        className="login-jewel__shape"
        fill="none"
        d="M28 14 L32 10 L36 14"
      />
    </svg>
  );
}

function NecklaceIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <path
        className="login-jewel__shape"
        fill="none"
        d="M10 18 Q32 52 54 18"
      />
      <circle className="login-jewel__shape" cx="32" cy="44" r="8" />
      <path className="login-jewel__shape" d="M32 36 L32 28 M28 32 L36 32" />
    </svg>
  );
}

function EarringIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <circle className="login-jewel__shape" cx="32" cy="14" r="4" fill="none" />
      <path className="login-jewel__shape" fill="none" d="M32 18 L32 28" />
      <path
        className="login-jewel__shape"
        d="M26 28 L32 52 L38 28 Z"
      />
    </svg>
  );
}

function GemIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <path className="login-jewel__shape" d="M32 8 L48 24 L32 56 L16 24 Z" />
      <path
        className="login-jewel__shape"
        fill="none"
        d="M16 24 L48 24 M24 24 L32 8 L40 24"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <path
        className="login-jewel__shape"
        fill="none"
        d="M32 8 L34 28 L54 32 L34 36 L32 56 L30 36 L10 32 L30 28 Z"
      />
    </svg>
  );
}

export default function LoginJewelleryBackground() {
  return (
    <div className="login-jewels" aria-hidden>
      <div className="login-jewel login-jewel--1 login-jewel--sparkle">
        <DiamondIcon />
      </div>
      <div className="login-jewel login-jewel--2">
        <RingIcon />
      </div>
      <div className="login-jewel login-jewel--3">
        <NecklaceIcon />
      </div>
      <div className="login-jewel login-jewel--4 login-jewel--sparkle">
        <GemIcon />
      </div>
      <div className="login-jewel login-jewel--5">
        <EarringIcon />
      </div>
      <div className="login-jewel login-jewel--6">
        <SparkleIcon />
      </div>
    </div>
  );
}
