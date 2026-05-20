"use client";

import { RefObject, useEffect, useState } from "react";

export function useRevealOnScroll<T extends HTMLElement>(
  ref: RefObject<T>,
  options?: { threshold?: number; rootMargin?: string }
) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: options?.threshold ?? 0.12,
        rootMargin: options?.rootMargin ?? "0px 0px -60px 0px",
      }
    );

    observer.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      observer.disconnect();
    }

    return () => observer.disconnect();
  }, [ref, options?.rootMargin, options?.threshold]);

  return visible;
}

