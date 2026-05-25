"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import productContent, { formatProductCopy } from "@/lib/productContent";
import type { Product } from "@/types/product";
import { formatProductPrice } from "@/utils/formatPrice";
import { getProductHref } from "@/utils/productUrl";

const copy = productContent.nav;
const SEARCH_LIMIT = 8;
const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

type HeaderNavSearchProps = {
  variant?: "compact" | "expanded" | "mobile";
  className?: string;
  onNavigate?: () => void;
};

function getProductImage(product: Product): string {
  return product.image || product.images?.[0] || "/placeholder.jpg";
}

export default function HeaderNavSearch({
  variant = "compact",
  className = "",
  onNavigate,
}: HeaderNavSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(variant !== "compact");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(query.trim());
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(SEARCH_LIMIT),
        category: "all",
        q,
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setResults([]);
        return;
      }

      setResults((data.products as Product[]) ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQ.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    void fetchResults(debouncedQ);
  }, [debouncedQ, fetchResults]);

  useEffect(() => {
    const showPanel =
      debouncedQ.length >= MIN_QUERY_LENGTH &&
      (loading || results.length > 0 || (!loading && query.trim().length >= MIN_QUERY_LENGTH));
    setPanelOpen(showPanel && (variant === "mobile" || isOpen));
    if (!showPanel) {
      setActiveIndex(-1);
    }
  }, [debouncedQ, loading, results.length, query, variant, isOpen]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        if (variant === "compact") {
          setIsOpen(false);
        }
        setPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [variant]);

  const goToProductsPage = (term: string) => {
    const trimmed = term.trim();
    onNavigate?.();
    setPanelOpen(false);
    if (variant === "compact") {
      setIsOpen(false);
    }
    if (!trimmed) {
      router.push("/products");
      return;
    }
    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  };

  const goToProduct = (product: Product) => {
    onNavigate?.();
    setQuery("");
    setDebouncedQ("");
    setResults([]);
    setPanelOpen(false);
    if (variant === "compact") {
      setIsOpen(false);
    }
    router.push(getProductHref(product));
  };

  const openSearch = () => {
    setIsOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
      setPanelOpen(false);
      if (variant === "compact") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        goToProduct(results[activeIndex]);
        return;
      }
      goToProductsPage(query);
      return;
    }

    if (!panelOpen || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    }
  };

  const showInput = variant === "expanded" || variant === "mobile" || isOpen;
  const rootClass = [
    "header-search",
    `header-search--${variant}`,
    isOpen ? "header-search--open" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const statusMessage =
    debouncedQ.length < MIN_QUERY_LENGTH
      ? null
      : loading
        ? copy.searching
        : results.length === 0
          ? copy.noResults
          : null;

  return (
    <div ref={rootRef} className={rootClass}>
      <form
        className="header-search-form"
        role="search"
        suppressHydrationWarning
        onSubmit={(event) => {
          event.preventDefault();
          goToProductsPage(query);
        }}
      >
        {variant === "compact" && !isOpen ? (
          <button
            type="button"
            className="header-search-toggle"
            aria-label={copy.searchLabel}
            aria-expanded={false}
            aria-controls={listboxId}
            onClick={openSearch}
            suppressHydrationWarning
          >
            <Search size={20} aria-hidden />
          </button>
        ) : null}

        {showInput ? (
          <div className="header-search-input-wrap">
            <label htmlFor={inputId} className="sr-only">
              {copy.searchLabel}
            </label>
            <Search
              size={16}
              className="shrink-0 text-gray-400"
              aria-hidden
            />
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (variant === "compact") {
                  setIsOpen(true);
                }
                if (debouncedQ.length >= MIN_QUERY_LENGTH) {
                  setPanelOpen(true);
                }
              }}
              placeholder={copy.searchPlaceholder}
              className="header-search-input"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={panelOpen ? listboxId : undefined}
              aria-expanded={panelOpen}
              suppressHydrationWarning
            />
            {query ? (
              <button
                type="button"
                className="header-search-clear"
                aria-label={productContent.list.clearSearch}
                suppressHydrationWarning
                onClick={() => {
                  setQuery("");
                  setDebouncedQ("");
                  setResults([]);
                  setPanelOpen(false);
                  inputRef.current?.focus();
                }}
              >
                <X size={14} aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}
      </form>

      {panelOpen ? (
        <div
          id={listboxId}
          className="header-search-panel"
          role="listbox"
          aria-label={copy.searchLabel}
        >
          {statusMessage ? (
            <p className="header-search-status" role="status">
              {statusMessage}
            </p>
          ) : null}

          {results.length > 0 ? (
            <div className="header-search-results">
              {results.map((product, index) => {
                const imageSrc = imageErrors[product.id]
                  ? "/placeholder.jpg"
                  : getProductImage(product);
                const isActive = index === activeIndex;

                return (
                  <button
                    key={product.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`header-search-result${
                      isActive ? " header-search-result--active" : ""
                    }`}
                    suppressHydrationWarning
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goToProduct(product)}
                  >
                    <Image
                      src={imageSrc}
                      alt=""
                      width={48}
                      height={48}
                      className="header-search-result-img"
                      unoptimized={imageSrc.startsWith("http")}
                      onError={() =>
                        setImageErrors((prev) => ({
                          ...prev,
                          [product.id]: true,
                        }))
                      }
                    />
                    <span className="header-search-result-body">
                      <span className="header-search-result-name">
                        {product.name}
                      </span>
                      <span className="header-search-result-price">
                        {formatProductPrice(product.price)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {debouncedQ.length >= MIN_QUERY_LENGTH && !loading ? (
            <div className="header-search-footer">
              <button
                type="button"
                className="header-search-view-all"
                suppressHydrationWarning
                onClick={() => goToProductsPage(debouncedQ)}
              >
                {formatProductCopy(copy.viewAllResults, { query: debouncedQ })}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {variant === "mobile" && debouncedQ.length >= MIN_QUERY_LENGTH ? (
        <Link
          href={`/products?q=${encodeURIComponent(debouncedQ)}`}
          className="sr-only"
          onClick={onNavigate}
        >
          {formatProductCopy(copy.viewAllResults, { query: debouncedQ })}
        </Link>
      ) : null}
    </div>
  );
}
