"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  clearWasOnNotFoundPage,
  dispatchHomeRefetch,
  wasOnNotFoundPage,
} from "@/lib/homeRefetch";

/**
 * Lives in root layout (never unmounts).
 * Handles browser Back from 404 → home when the 404 page listener is already gone.
 */
export default function NavigationGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    const reloadHomeAfterNotFound = () => {
      if (window.location.pathname !== "/") return;

      dispatchHomeRefetch();
      router.refresh();

      if (wasOnNotFoundPage()) {
        clearWasOnNotFoundPage();
        window.location.reload();
      }
    };

    if (pathname === "/" && prevPath.current && prevPath.current !== "/") {
      reloadHomeAfterNotFound();
    }

    prevPath.current = pathname;

    const onPopState = () => {
      queueMicrotask(reloadHomeAfterNotFound);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (window.location.pathname !== "/") return;

      if (event.persisted) {
        clearWasOnNotFoundPage();
        window.location.reload();
        return;
      }

      reloadHomeAfterNotFound();
    };

    window.addEventListener("popstate", onPopState, true);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("popstate", onPopState, true);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pathname, router]);

  return null;
}
