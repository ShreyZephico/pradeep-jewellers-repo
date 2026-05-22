"use client";

import { useEffect } from "react";

export function useRevealOnScroll(selector = ".bespoke-page [data-reveal]") {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>(selector);
    if (!nodes.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      nodes.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selector]);
}
