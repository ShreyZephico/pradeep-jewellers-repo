"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import productContent, { formatProductCopy } from "@/lib/productContent";
import type { CollectionFilterOption } from "@/lib/shopCollectionFilters";
import { COLLECTION_FILTER_VISIBLE_COUNT } from "@/lib/shopCollectionFilters";

const listCopy = productContent.list;

type CollectionFilterCheckboxGroupProps = {
  legend: string;
  options: CollectionFilterOption[];
  selected: string[];
  onToggle: (id: string) => void;
  inputName: string;
  previewCount?: number;
  moreCountLabel?: string;
  showLessLabel?: string;
};

function MaterialSwatch({ swatch }: { swatch: string }) {
  const isNamed = ["platinum", "gold", "diamond", "silver", "gemstone"].includes(
    swatch
  );

  return (
    <span
      className={`collection-filter-swatch${
        isNamed ? ` collection-filter-swatch--${swatch}` : ""
      }`}
      style={isNamed ? undefined : { background: swatch }}
      aria-hidden
    />
  );
}

export default function CollectionFilterCheckboxGroup({
  legend,
  options,
  selected,
  onToggle,
  inputName,
  previewCount = COLLECTION_FILTER_VISIBLE_COUNT,
  moreCountLabel,
  showLessLabel = "Show less",
}: CollectionFilterCheckboxGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const hasMore = options.length > previewCount;
  const selectedHidden = useMemo(
    () =>
      hasMore &&
      selected.some((id) => {
        const index = options.findIndex((option) => option.id === id);
        return index >= previewCount;
      }),
    [hasMore, options, previewCount, selected]
  );
  const showAll = expanded || selectedHidden;
  const visibleOptions = showAll ? options : options.slice(0, previewCount);
  const hiddenCount = Math.max(0, options.length - previewCount);

  useEffect(() => {
    if (selectedHidden) {
      setExpanded(true);
    }
  }, [selectedHidden]);

  return (
    <>
      <fieldset className="collection-filter-checkboxes">
        <legend className="sr-only">{legend}</legend>
        {visibleOptions.map((option) => {
          const checked = selected.includes(option.id);
          const inputId = `${inputName}-${option.id}`;
          return (
            <label key={option.id} className="collection-filter-checkbox" htmlFor={inputId}>
              <input
                id={inputId}
                type="checkbox"
                className="collection-filter-checkbox-input"
                checked={checked}
                onChange={() => onToggle(option.id)}
              />
              <span className="collection-filter-checkbox-box" aria-hidden />
              {option.swatch ? <MaterialSwatch swatch={option.swatch} /> : null}
              <span className="collection-filter-checkbox-label">{option.label}</span>
            </label>
          );
        })}
      </fieldset>
      {hasMore && !selectedHidden ? (
        <button
          type="button"
          className="collection-filter-show-more"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          <ChevronDown
            size={14}
            aria-hidden
            className={`collection-filter-show-more-icon${
              expanded ? " collection-filter-show-more-icon--open" : ""
            }`}
          />
          {expanded
            ? showLessLabel
            : (moreCountLabel ??
              formatProductCopy(listCopy.filterMoreCount, { count: hiddenCount }))}
        </button>
      ) : null}
    </>
  );
}
