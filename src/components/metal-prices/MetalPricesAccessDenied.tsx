import Link from "next/link";

export default function MetalPricesAccessDenied() {
  return (
    <main className="metal-access">
      <div className="metal-access__card">
        <h1>Sign in required</h1>
        <p>Please log in to manage today&apos;s gold and silver prices.</p>
        <Link
          href="/login?returnTo=%2Fmetal-prices"
          className="metal-access__btn"
        >
          Go to login
        </Link>
      </div>
    </main>
  );
}
