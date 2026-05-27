"use client";

import { SlidersHorizontal, X } from "lucide-react";

import productContent from "@/lib/productContent";

const copy = productContent.list;
const categories = productContent.categories;
const priceTiers = productContent.priceTiers;

type ProductsFilterSidebarProps = {
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  selectedPriceTier: string;
  onPriceTierChange: (id: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

export default function ProductsFilterSidebar({
  selectedCategory,
  onCategoryChange,
  selectedPriceTier,
  onPriceTierChange,
  onClearAll,
  hasActiveFilters,
  mobileOpen,
  onMobileOpenChange,
}: ProductsFilterSidebarProps) {
  const panel = (
    <div className="collection-sidebar-inner">
      <div className="collection-sidebar-mobile-head">
        <h2 className="collection-sidebar-mobile-title">{copy.filtersTitle}</h2>
        <button
          type="button"
          className="collection-sidebar-close"
          aria-label={copy.filtersClose}
          onClick={() => onMobileOpenChange(false)}
        >
          <X size={20} aria-hidden />
        </button>
      </div>

      <section className="collection-filter-block">
        <h3 className="collection-filter-heading">{copy.categoryTitle}</h3>
        <ul className="collection-filter-list" role="list">
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                className={`collection-filter-item${
                  selectedCategory === cat.id ? " collection-filter-item--active" : ""
                }`}
                onClick={() => onCategoryChange(cat.id)}
                aria-pressed={selectedCategory === cat.id}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="collection-filter-block">
        <h3 className="collection-filter-heading">{copy.priceTitle}</h3>
        <fieldset className="collection-filter-radios">
          <legend className="sr-only">{copy.priceTitle}</legend>
          {priceTiers.map((tier) => (
            <label key={tier.id} className="collection-filter-radio">
              <input
                type="radio"
                name="price-tier"
                value={tier.id}
                checked={selectedPriceTier === tier.id}
                onChange={() => onPriceTierChange(tier.id)}
              />
              <span>{tier.label}</span>
            </label>
          ))}
        </fieldset>
      </section>

      {hasActiveFilters ? (
        <button type="button" className="collection-filter-clear" onClick={onClearAll}>
          {copy.clearFilters}
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="collection-filter-mobile-trigger"
        onClick={() => onMobileOpenChange(true)}
        aria-expanded={mobileOpen}
      >
        <SlidersHorizontal size={18} aria-hidden />
        {copy.filtersOpen}
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="collection-filter-backdrop"
          aria-label={copy.filtersClose}
          onClick={() => onMobileOpenChange(false)}
        />
      ) : null}

      <aside
        className={`collection-sidebar${mobileOpen ? " collection-sidebar--open" : ""}`}
        aria-label={copy.filtersTitle}
      >
        {panel}
      </aside>
    </>
  );
}
