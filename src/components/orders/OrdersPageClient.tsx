"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import AccountShell from "@/components/profile/AccountShell";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

type MoneyAmount = {
  amount: string;
  currencyCode: string;
};

type CustomerOrderLineItem = {
  title: string;
  quantity: number;
  imageUrl: string | null;
  imageAlt: string | null;
  productHandle: string | null;
  totalPrice: MoneyAmount | null;
};

type CustomerOrder = {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: MoneyAmount;
  statusUrl: string | null;
  lineItems: CustomerOrderLineItem[];
};

type OrdersResponse = {
  success?: boolean;
  orders?: CustomerOrder[];
  pageInfo?: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  error?: string;
};

function formatMoney(money: MoneyAmount): string {
  const amount = Number.parseFloat(money.amount);
  if (!Number.isFinite(amount)) return money.amount;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: money.currencyCode || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${money.currencyCode} ${amount.toFixed(0)}`;
  }
}

function formatOrderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function labelStatus(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(kind: "payment" | "fulfillment", value: string): string {
  const normalized = value.toLowerCase();
  if (kind === "payment") {
    if (normalized === "paid") return "orders-status--success";
    if (normalized === "pending" || normalized === "authorized") {
      return "orders-status--pending";
    }
    return "orders-status--muted";
  }

  if (normalized === "fulfilled") return "orders-status--success";
  if (normalized === "partially_fulfilled") return "orders-status--pending";
  if (normalized === "unfulfilled") return "orders-status--pending";
  return "orders-status--muted";
}

export default function OrdersPageClient() {
  const { isLoggedIn, loading: authLoading, goToLogin } = useCustomerAuth();
  const { profile, loading: profileLoading } = useCustomerProfile();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (after?: string | null, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setOrdersLoading(true);
        setError(null);
      }

      try {
        const params = new URLSearchParams({ limit: "10" });
        if (after) params.set("after", after);

        const response = await fetch(`/api/customer/orders?${params}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          goToLogin();
          return;
        }

        const data = await parseJsonResponse<OrdersResponse>(response);

        if (!data?.success || !data.orders) {
          throw new Error(data?.error || "Could not load orders.");
        }

        setOrders((prev) =>
          append ? [...prev, ...data.orders!] : data.orders!
        );
        setHasNextPage(Boolean(data.pageInfo?.hasNextPage));
        setEndCursor(data.pageInfo?.endCursor ?? null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load orders."
        );
      } finally {
        setOrdersLoading(false);
        setLoadingMore(false);
      }
    },
    [goToLogin]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      goToLogin();
      return;
    }
    void loadOrders();
  }, [authLoading, isLoggedIn, goToLogin, loadOrders]);

  const loading = authLoading || profileLoading || ordersLoading;

  return (
    <AccountShell
      active="orders"
      pageTitle="My orders"
      pageSubtitle="View order history, items, and delivery status."
      breadcrumbLabel="My orders"
      profile={profile}
      loading={loading}
    >
      {error ? (
        <p className="profile-alert profile-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!error && !loading && orders.length === 0 ? (
        <section className="profile-card orders-empty">
          <h2 className="profile-card__title">No orders yet</h2>
          <p className="profile-card__hint">
            When you place an order, it will appear here with payment and
            delivery status.
          </p>
          <div className="profile-actions">
            <Link href="/shop" className="profile-btn profile-btn--primary">
              Browse jewellery
            </Link>
          </div>
        </section>
      ) : null}

      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((order) => {
            const isOpen = expandedId === order.id;
            const previewItems = order.lineItems.slice(0, 2);
            const moreCount = Math.max(
              order.lineItems.length - previewItems.length,
              0
            );

            return (
              <article key={order.id} className="orders-card profile-card">
                <div className="orders-card__head">
                  <div className="orders-card__meta">
                    <h2 className="orders-card__title">{order.name}</h2>
                    <p className="orders-card__date">
                      Placed on {formatOrderDate(order.processedAt)}
                    </p>
                  </div>
                  <div className="orders-card__total">
                    <span className="orders-card__total-label">Total</span>
                    <strong>{formatMoney(order.totalPrice)}</strong>
                  </div>
                </div>

                <div className="orders-card__statuses">
                  <span
                    className={`orders-status ${statusClass(
                      "payment",
                      order.financialStatus
                    )}`}
                  >
                    Payment: {labelStatus(order.financialStatus)}
                  </span>
                  <span
                    className={`orders-status ${statusClass(
                      "fulfillment",
                      order.fulfillmentStatus
                    )}`}
                  >
                    Delivery: {labelStatus(order.fulfillmentStatus)}
                  </span>
                </div>

                <div className="orders-card__preview">
                  {previewItems.map((item) => (
                    <div key={`${order.id}-${item.title}`} className="orders-item">
                      <div className="orders-item__thumb">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.imageAlt || item.title}
                            width={56}
                            height={56}
                          />
                        ) : (
                          <span aria-hidden>◇</span>
                        )}
                      </div>
                      <div className="orders-item__info">
                        <p className="orders-item__title">{item.title}</p>
                        <p className="orders-item__qty">Qty {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {moreCount > 0 ? (
                    <p className="orders-card__more">
                      +{moreCount} more item{moreCount === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>

                <div className="orders-card__actions">
                  <button
                    type="button"
                    className="profile-btn profile-btn--ghost"
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? "Hide items" : "View items"}
                  </button>
                  {order.statusUrl ? (
                    <a
                      href={order.statusUrl}
                      className="profile-btn profile-btn--secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Track order
                    </a>
                  ) : null}
                </div>

                {isOpen ? (
                  <div className="orders-card__details">
                    {order.lineItems.map((item) => (
                      <div
                        key={`${order.id}-detail-${item.title}`}
                        className="orders-detail-row"
                      >
                        <div className="orders-item__thumb orders-item__thumb--lg">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.imageAlt || item.title}
                              width={72}
                              height={72}
                            />
                          ) : (
                            <span aria-hidden>◇</span>
                          )}
                        </div>
                        <div className="orders-detail-row__body">
                          {item.productHandle ? (
                            <Link
                              href={`/products/${item.productHandle}`}
                              className="orders-detail-row__title"
                            >
                              {item.title}
                            </Link>
                          ) : (
                            <p className="orders-detail-row__title">
                              {item.title}
                            </p>
                          )}
                          <p className="orders-detail-row__meta">
                            Qty {item.quantity}
                            {item.totalPrice
                              ? ` · ${formatMoney(item.totalPrice)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {hasNextPage ? (
        <div className="orders-load-more">
          <button
            type="button"
            className="profile-btn profile-btn--secondary"
            onClick={() => loadOrders(endCursor, true)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load more orders"}
          </button>
        </div>
      ) : null}
    </AccountShell>
  );
}
