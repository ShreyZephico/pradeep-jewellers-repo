"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";

import CollectionFilterCheckboxGroup from "@/components/productComponent/CollectionFilterCheckboxGroup";
import productContent, { formatProductCopy } from "@/lib/productContent";
import {
  collectionFilterConfig,
  toggleFacetSelection,
  type CollectionFacetFilters,
} from "@/lib/shopCollectionFilters";
import {
  categoryShowsRingSizeFilter,
  formatRingFilterSizeLabel,
  getRingFilterExtraOptions,
  getRingFilterPreviewOptions,
  RING_FILTER_PREVIEW_SIZES,
} from "@/utils/ringSizeChart";

const copy = productContent.list;
const filterCopy = collectionFilterConfig;
const priceTiers = productContent.priceTiers;
const ringPreviewSizes = getRingFilterPreviewOptions();
const ringExtraSizes = getRingFilterExtraOptions();

type FilterSectionProps = {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  activeCount?: number;
  children: ReactNode;
};

function FilterSection({
  id,
  title,
  open,
  onToggle,
  activeCount = 0,
  children,
}: FilterSectionProps) {
  const panelId = `collection-filter-panel-${id}`;

  return (
    <section className="collection-filter-block">
      <button
        type="button"
        className="collection-filter-section-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="collection-filter-section-title">{title}</span>
        <span className="collection-filter-section-meta">
          {activeCount > 0 ? (
            <span className="collection-filter-section-badge">{activeCount}</span>
          ) : null}
          <ChevronDown
            size={18}
            aria-hidden
            className={`collection-filter-chevron${open ? " collection-filter-chevron--open" : ""}`}
          />
        </span>
      </button>
      {open ? (
        <div id={panelId} className="collection-filter-section-panel">
          {children}
        </div>
      ) : null}
    </section>
  );
}

type ProductsFilterSidebarProps = {
  /** Used only to show ring-size section when viewing rings (or all). */
  selectedCategory: string;
  filterBadgeCount: number;
  selectedPriceTier: string;
  onPriceTierChange: (id: string) => void;
  selectedRingSizes: string[];
  onRingSizesChange: (sizes: string[]) => void;
  facets: CollectionFacetFilters;
  onFacetsChange: (facets: CollectionFacetFilters) => void;
  onClearSidebarFilters: () => void;
  hasSidebarFilters: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

export default function ProductsFilterSidebar({
  selectedCategory,
  filterBadgeCount,
  selectedPriceTier,
  onPriceTierChange,
  selectedRingSizes,
  onRingSizesChange,
  facets,
  onFacetsChange,
  onClearSidebarFilters,
  hasSidebarFilters,
  mobileOpen,
  onMobileOpenChange,
}: ProductsFilterSidebarProps) {
  const showRingSizeFilter = categoryShowsRingSizeFilter(selectedCategory);

  const [ringSizeOpen, setRingSizeOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [discountOpen, setDiscountOpen] = useState(true);
  const [weightOpen, setWeightOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [metalOpen, setMetalOpen] = useState(false);
  const [shopForOpen, setShopForOpen] = useState(false);
  const [occasionOpen, setOccasionOpen] = useState(false);
  const [ringSizesExpanded, setRingSizesExpanded] = useState(false);

  const updateFacet = (key: keyof CollectionFacetFilters, id: string) => {
    onFacetsChange({
      ...facets,
      [key]: toggleFacetSelection(facets[key], id),
    });
  };

  const hasMoreRingSizes = ringExtraSizes.length > 0;
  const selectedRingSizeHidden =
    hasMoreRingSizes &&
    selectedRingSizes.some(
      (size) =>
        !RING_FILTER_PREVIEW_SIZES.includes(
          size as (typeof RING_FILTER_PREVIEW_SIZES)[number]
        )
    );
  const showAllRingSizes = ringSizesExpanded || selectedRingSizeHidden;
  const visibleRingSizes = showAllRingSizes
    ? [...ringPreviewSizes, ...ringExtraSizes]
    : ringPreviewSizes;

  useEffect(() => {
    if (selectedRingSizeHidden) {
      setRingSizesExpanded(true);
    }
  }, [selectedRingSizeHidden]);

  useEffect(() => {
    if (!showRingSizeFilter) {
      setRingSizesExpanded(false);
    }
  }, [showRingSizeFilter]);

  const toggleRingSize = (size: string) => {
    onRingSizesChange(
      selectedRingSizes.includes(size)
        ? selectedRingSizes.filter((value) => value !== size)
        : [...selectedRingSizes, size]
    );
  };

  const panel = (
    <div className="collection-sidebar-inner">
      <div className="collection-sidebar-mobile-head">
        <div className="collection-sidebar-mobile-head-start">
          <h2 className="collection-sidebar-mobile-title">{copy.filtersTitle}</h2>
          {filterBadgeCount > 0 ? (
            <span className="collection-filter-toolbar-badge">{filterBadgeCount}</span>
          ) : null}
        </div>
        <div className="collection-sidebar-mobile-head-actions">
          {hasSidebarFilters ? (
            <button
              type="button"
              className="collection-filter-toolbar-clear"
              onClick={onClearSidebarFilters}
            >
              {copy.filtersClearAll}
            </button>
          ) : null}
          <button
            type="button"
            className="collection-sidebar-close"
            aria-label={copy.filtersClose}
            onClick={() => onMobileOpenChange(false)}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
      </div>

      <div className="collection-filter-toolbar">
        <div className="collection-filter-toolbar-start">
          <h2 className="collection-filter-toolbar-title">{copy.filtersTitle}</h2>
          {filterBadgeCount > 0 ? (
            <span className="collection-filter-toolbar-badge">{filterBadgeCount}</span>
          ) : null}
        </div>
        {hasSidebarFilters ? (
          <button
            type="button"
            className="collection-filter-toolbar-clear"
            onClick={onClearSidebarFilters}
          >
            {copy.filtersClearAll}
          </button>
        ) : null}
      </div>

      {showRingSizeFilter ? (
        <FilterSection
          id="ring-size"
          title={copy.ringSizeTitle}
          open={ringSizeOpen}
          onToggle={() => setRingSizeOpen((prev) => !prev)}
          activeCount={selectedRingSizes.length}
        >
          <fieldset className="collection-filter-checkboxes">
            <legend className="sr-only">{copy.ringSizeTitle}</legend>
            {visibleRingSizes.map((option) => {
              const checked = selectedRingSizes.includes(option.size);
              const inputId = `ring-size-filter-${option.size}`;
              return (
                <label key={option.size} className="collection-filter-checkbox" htmlFor={inputId}>
                  <input
                    id={inputId}
                    type="checkbox"
                    className="collection-filter-checkbox-input"
                    checked={checked}
                    onChange={() => toggleRingSize(option.size)}
                  />
                  <span className="collection-filter-checkbox-box" aria-hidden />
                  <span className="collection-filter-checkbox-label">
                    {formatRingFilterSizeLabel(option)}
                  </span>
                </label>
              );
            })}
          </fieldset>
          {hasMoreRingSizes && !selectedRingSizeHidden ? (
            <button
              type="button"
              className="collection-filter-show-more"
              onClick={() => setRingSizesExpanded((prev) => !prev)}
              aria-expanded={ringSizesExpanded}
            >
              <ChevronDown
                size={14}
                aria-hidden
                className={`collection-filter-show-more-icon${
                  ringSizesExpanded ? " collection-filter-show-more-icon--open" : ""
                }`}
              />
              {ringSizesExpanded
                ? copy.ringSizeViewLess
                : formatProductCopy(copy.ringSizeMoreCount, {
                    count: ringExtraSizes.length,
                  })}
            </button>
          ) : null}
        </FilterSection>
      ) : null}

      <FilterSection
        id="price"
        title={copy.priceTitle}
        open={priceOpen}
        onToggle={() => setPriceOpen((prev) => !prev)}
        activeCount={selectedPriceTier !== "any" ? 1 : 0}
      >
        <fieldset className="collection-filter-checkboxes collection-filter-checkboxes--price">
          <legend className="sr-only">{copy.priceTitle}</legend>
          {priceTiers.map((tier) => {
            const checked = selectedPriceTier === tier.id;
            const inputId = `price-tier-filter-${tier.id}`;
            return (
              <label key={tier.id} className="collection-filter-checkbox" htmlFor={inputId}>
                <input
                  id={inputId}
                  type="radio"
                  name="price-tier-filter"
                  className="collection-filter-checkbox-input"
                  checked={checked}
                  onChange={() => onPriceTierChange(tier.id)}
                />
                <span className="collection-filter-checkbox-box" aria-hidden />
                <span className="collection-filter-checkbox-label">{tier.label}</span>
              </label>
            );
          })}
        </fieldset>
      </FilterSection>

      <FilterSection
        id="discounts"
        title={filterCopy.discountTitle}
        open={discountOpen}
        onToggle={() => setDiscountOpen((prev) => !prev)}
        activeCount={facets.discounts.length}
      >
        <CollectionFilterCheckboxGroup
          legend={filterCopy.discountTitle}
          options={filterCopy.discounts}
          selected={facets.discounts}
          onToggle={(id) => updateFacet("discounts", id)}
          inputName="discount-filter"
          showLessLabel={copy.filterShowLess}
        />
      </FilterSection>

      <FilterSection
        id="weight"
        title={filterCopy.weightTitle}
        open={weightOpen}
        onToggle={() => setWeightOpen((prev) => !prev)}
        activeCount={facets.weights.length}
      >
        <CollectionFilterCheckboxGroup
          legend={filterCopy.weightTitle}
          options={filterCopy.weightRanges}
          selected={facets.weights}
          onToggle={(id) => updateFacet("weights", id)}
          inputName="weight-filter"
          showLessLabel={copy.filterShowLess}
        />
      </FilterSection>

      <FilterSection
        id="material"
        title={filterCopy.materialTitle}
        open={materialOpen}
        onToggle={() => setMaterialOpen((prev) => !prev)}
        activeCount={facets.materials.length}
      >
        <CollectionFilterCheckboxGroup
          legend={filterCopy.materialTitle}
          options={filterCopy.materials}
          selected={facets.materials}
          onToggle={(id) => updateFacet("materials", id)}
          inputName="material-filter"
          showLessLabel={copy.filterShowLess}
        />
      </FilterSection>

      <FilterSection
        id="metal"
        title={filterCopy.metalTitle}
        open={metalOpen}
        onToggle={() => setMetalOpen((prev) => !prev)}
        activeCount={facets.metals.length}
      >
        <CollectionFilterCheckboxGroup
          legend={filterCopy.metalTitle}
          options={filterCopy.metals}
          selected={facets.metals}
          onToggle={(id) => updateFacet("metals", id)}
          inputName="metal-filter"
          showLessLabel={copy.filterShowLess}
        />
      </FilterSection>

      <FilterSection
        id="shop-for"
        title={filterCopy.shopForTitle}
        open={shopForOpen}
        onToggle={() => setShopForOpen((prev) => !prev)}
        activeCount={facets.shopFor.length}
      >
        <CollectionFilterCheckboxGroup
          legend={filterCopy.shopForTitle}
          options={filterCopy.shopFor}
          selected={facets.shopFor}
          onToggle={(id) => updateFacet("shopFor", id)}
          inputName="shop-filter"
          showLessLabel={copy.filterShowLess}
        />
      </FilterSection>

      <FilterSection
        id="occasion"
        title={filterCopy.occasionTitle}
        open={occasionOpen}
        onToggle={() => setOccasionOpen((prev) => !prev)}
        activeCount={facets.occasions.length}
      >
        <CollectionFilterCheckboxGroup
          legend={filterCopy.occasionTitle}
          options={filterCopy.occasions}
          selected={facets.occasions}
          onToggle={(id) => updateFacet("occasions", id)}
          inputName="occasion-filter"
          showLessLabel={copy.filterShowLess}
        />
      </FilterSection>
    </div>
  );

  return (
    <>
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
        aria-hidden={!mobileOpen}
      >
        {panel}
      </aside>
    </>
  );
}
