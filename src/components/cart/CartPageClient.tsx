"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShoppingBag, Trash2 } from "lucide-react";

import CartLineImage from "@/components/cart/CartLineImage";
import PriceCalculationBreakdown from "@/components/PriceCalculationBreakdown";
import { useCart } from "@/contexts/CartContext";
import { useCartLineBreakdowns } from "@/hooks/useCartLineBreakdowns";
import type { CartLineBreakdownData } from "@/lib/cartBreakdown";
import productContent, { formatProductCopy } from "@/lib/productContent";
import type { ClientCartLine } from "@/types/cart";
import { formatProductPrice } from "@/utils/formatPrice";

import "@/styles/cart-page.css";
import "@/styles/product.css";

const copy = productContent.cart;
const breadcrumb = productContent.breadcrumb;

export default function CartPageClient() {
  const router = useRouter();
  const { cart, loading, refreshCart, setAuthenticated } = useCart();
  const { breakdowns, loading: breakdownLoading } = useCartLineBreakdowns(
    cart.lines
  );
  const [authChecked, setAuthChecked] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [lineLoadingId, setLineLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/check", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const ok = Boolean(data.isAuthenticated);
        setAuthenticated(ok);
        if (!ok) {
          localStorage.setItem("redirectAfterLogin", "/cart");
          router.replace("/login");
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router, setAuthenticated]);

  const updateQuantity = async (lineId: string, quantity: number) => {
    setLineLoadingId(lineId);
    setError("");
    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId, quantity }),
      });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const data = await response.json();
        setError(typeof data.error === "string" ? data.error : copy.updateError);
        return;
      }
      await refreshCart();
    } catch {
      setError(copy.updateError);
    } finally {
      setLineLoadingId(null);
    }
  };

  const removeLine = async (lineId: string) => {
    setLineLoadingId(lineId);
    setError("");
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId }),
      });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        const data = await response.json();
        setError(typeof data.error === "string" ? data.error : copy.updateError);
        return;
      }
      await refreshCart();
    } catch {
      setError(copy.updateError);
    } finally {
      setLineLoadingId(null);
    }
  };

  const checkout = async () => {
    setCheckoutLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok || !data.checkoutUrl) {
        setError(typeof data.error === "string" ? data.error : copy.checkoutError);
        return;
      }
      window.location.href = data.checkoutUrl as string;
    } catch {
      setError(copy.checkoutError);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="cart-page cart-page--loading">
        <Loader2 className="cart-page-spinner" size={36} aria-hidden />
        <p>{copy.loading}</p>
      </div>
    );
  }

  const isEmpty = !loading && cart.lines.length === 0;

  return (
    <div className="cart-page">
      <div className="cart-page-container">
        <nav className="cart-page-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">{breadcrumb.home}</Link>
          <span aria-hidden>{breadcrumb.separator}</span>
          <span>{copy.pageTitle}</span>
        </nav>

        <header className="cart-page-header">
          <div>
            <h1 className="cart-page-title">{copy.pageTitle}</h1>
            {cart.totalQuantity > 0 ? (
              <p className="cart-page-subtitle">
                {formatProductCopy(copy.itemCount, { count: cart.totalQuantity })}
              </p>
            ) : null}
          </div>
          <Link href="/products" className="cart-page-continue-link">
            <ArrowLeft size={18} aria-hidden />
            {copy.continueShopping}
          </Link>
        </header>

        {error ? (
          <p className="cart-page-error" role="alert">
            {error}
          </p>
        ) : null}

        {loading && cart.lines.length === 0 ? (
          <div className="cart-page-empty">
            <Loader2 className="cart-page-spinner" size={40} />
            <p>{copy.loading}</p>
          </div>
        ) : isEmpty ? (
          <div className="cart-page-empty">
            <div className="cart-page-empty-icon" aria-hidden>
              <ShoppingBag size={40} strokeWidth={1.5} />
            </div>
            <h2 className="cart-page-empty-title">{copy.emptyTitle}</h2>
            <p className="cart-page-empty-desc">{copy.emptyDescription}</p>
            <Link href="/products" className="cart-page-cta">
              {copy.shopLink}
            </Link>
          </div>
        ) : (
          <div className="cart-page-layout">
            <section className="cart-page-items" aria-label={copy.itemsLabel}>
              <ul className="cart-page-lines">
                {cart.lines.map((line) => (
                  <CartPageLine
                    key={line.id}
                    line={line}
                    lineBreakdown={breakdowns.get(line.id) ?? null}
                    breakdownLoading={breakdownLoading}
                    busy={lineLoadingId === line.id}
                    onDecrease={() => void updateQuantity(line.id, line.quantity - 1)}
                    onIncrease={() => void updateQuantity(line.id, line.quantity + 1)}
                    onRemove={() => void removeLine(line.id)}
                  />
                ))}
              </ul>
            </section>

            <aside className="cart-page-summary">
              <div className="cart-page-summary-card">
                <h2 className="cart-page-summary-title">{copy.orderSummary}</h2>
                <dl className="cart-page-summary-rows">
                  {cart.lines.map((line) => (
                    <div
                      key={line.id}
                      className="cart-page-summary-row cart-page-summary-row--product"
                    >
                      <dt className="cart-page-summary-product-name">
                        {line.title}
                        {line.quantity > 1 ? (
                          <span className="cart-page-summary-product-qty">
                            {" "}
                            ×{line.quantity}
                          </span>
                        ) : null}
                      </dt>
                      <dd>{formatProductPrice(line.lineTotalInr)}</dd>
                    </div>
                  ))}
                  <div className="cart-page-summary-row cart-page-summary-row--total">
                    <dt>{copy.total}</dt>
                    <dd>{formatProductPrice(cart.subtotalInr)}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="cart-page-checkout-btn"
                  disabled={checkoutLoading || loading}
                  onClick={() => void checkout()}
                >
                  {checkoutLoading ? (
                    <span className="cart-page-checkout-inner">
                      <Loader2 className="cart-page-spinner" size={20} aria-hidden />
                      {copy.checkoutLoading}
                    </span>
                  ) : (
                    copy.checkout
                  )}
                </button>
                <p className="cart-page-secure">{copy.secureNote}</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function CartPageLine({
  line,
  lineBreakdown,
  breakdownLoading,
  busy,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  line: ClientCartLine;
  lineBreakdown: CartLineBreakdownData | null;
  breakdownLoading: boolean;
  busy: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}) {
  const href = line.productHandle ? `/products/${line.productHandle}` : "/products";
  const visibleAttributes = line.attributes.filter(
    (a) => !a.key.startsWith("_pj_") && a.key !== "Design"
  );

  return (
    <li className={`cart-page-line${busy ? " cart-page-line--busy" : ""}`}>
      <Link href={href} className="cart-page-line-media">
        <CartLineImage src={line.imageUrl} alt={line.title} size="page" />
      </Link>

      <div className="cart-page-line-body">
        <div className="cart-page-line-top">
          <div>
            <Link href={href} className="cart-page-line-title">
              {line.title}
            </Link>
            {visibleAttributes.length > 0 ? (
              <ul className="cart-page-line-attrs">
                {visibleAttributes.map((attr) => (
                  <li key={`${attr.key}-${attr.value}`}>
                    <span className="cart-page-line-attr-key">{attr.key}</span>
                    {attr.value}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <p className="cart-page-line-price">
            {formatProductPrice(line.lineTotalInr)}
          </p>
        </div>

        {lineBreakdown || breakdownLoading ? (
          <details className="cart-page-line-breakdown">
            <summary className="cart-page-line-breakdown-toggle">
              {copy.lineBreakdownToggle}
              {line.quantity > 1 ? (
                <span className="cart-page-line-breakdown-qty">
                  {" "}
                  (×{line.quantity})
                </span>
              ) : null}
            </summary>
            <div className="cart-page-line-breakdown-body">
              {lineBreakdown ? (
                <PriceCalculationBreakdown
                  embedded
                  breakdown={lineBreakdown.breakdown}
                  weightGrams={lineBreakdown.weightGrams}
                  karatLabel={lineBreakdown.karatLabel}
                  optionAdjustments={lineBreakdown.optionAdjustments}
                  displayTotal={lineBreakdown.unitPrice}
                />
              ) : (
                <p className="cart-page-breakdown-loading">
                  {productContent.priceBreakdown.loading}
                </p>
              )}
              {line.quantity > 1 && lineBreakdown ? (
                <p className="cart-page-line-breakdown-line-total">
                  {formatProductCopy(copy.lineTotalLabel, {
                    count: line.quantity,
                  })}
                  : {formatProductPrice(line.lineTotalInr)}
                </p>
              ) : null}
            </div>
          </details>
        ) : null}

        <div className="cart-page-line-footer">
          <div className="cart-page-qty" aria-label={copy.quantityLabel}>
            <button
              type="button"
              className="cart-page-qty-btn"
              disabled={busy || line.quantity <= 1}
              onClick={onDecrease}
              aria-label={copy.decreaseQty}
            >
              −
            </button>
            <span className="cart-page-qty-value">{line.quantity}</span>
            <button
              type="button"
              className="cart-page-qty-btn"
              disabled={busy}
              onClick={onIncrease}
              aria-label={copy.increaseQty}
            >
              +
            </button>
          </div>
          <div className="cart-page-line-links">
            <Link href={href} className="cart-page-line-link">
              {copy.viewProduct}
            </Link>
            <button
              type="button"
              className="cart-page-line-remove"
              disabled={busy}
              onClick={onRemove}
            >
              <Trash2 size={14} aria-hidden />
              {copy.remove}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
