import Link from "next/link";

export default function CartPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-[var(--header-text)]">Your cart</h1>
      <p className="mt-4 text-[var(--header-text-muted)]">
        Your cart is empty. Browse our collection to find something you love.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-block rounded-md px-6 py-3 text-sm font-semibold text-white"
        style={{ background: "var(--header-accent)" }}
      >
        Continue shopping
      </Link>
    </main>
  );
}
