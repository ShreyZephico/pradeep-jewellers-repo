"use client";

import { useEffect } from "react";

const TOP_VAR = "--product-modal-inset-top";
const BOTTOM_VAR = "--product-modal-inset-bottom";

function measureChromeInsets() {
  const viewportHeight = window.innerHeight;
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");

  let top = 0;
  let bottom = 16;

  if (header) {
    const headerRect = header.getBoundingClientRect();
    top = Math.max(0, Math.round(headerRect.bottom));
  }

  if (footer) {
    const footerRect = footer.getBoundingClientRect();
    if (footerRect.top < viewportHeight) {
      bottom = Math.max(16, Math.round(viewportHeight - footerRect.top));
    }
  }

  const minBand = 200;
  if (viewportHeight - top - bottom < minBand) {
    bottom = Math.max(16, Math.round(viewportHeight - top - minBand));
  }

  document.documentElement.style.setProperty(TOP_VAR, `${top}px`);
  document.documentElement.style.setProperty(BOTTOM_VAR, `${bottom}px`);
}

function clearChromeInsets() {
  document.documentElement.style.removeProperty(TOP_VAR);
  document.documentElement.style.removeProperty(BOTTOM_VAR);
}

/** Positions portaled modals in the band between site header and footer. */
export function useModalChromeInsets(active: boolean) {
  useEffect(() => {
    if (!active) {
      clearChromeInsets();
      return;
    }

    measureChromeInsets();

    const onChange = () => measureChromeInsets();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, { passive: true });

    const observed = [
      document.querySelector("header"),
      document.querySelector("footer"),
    ].filter((node): node is Element => node instanceof Element);

    const resizeObserver =
      observed.length > 0 ? new ResizeObserver(onChange) : null;
    for (const node of observed) {
      resizeObserver?.observe(node);
    }

    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange);
      resizeObserver?.disconnect();
      clearChromeInsets();
    };
  }, [active]);
}
