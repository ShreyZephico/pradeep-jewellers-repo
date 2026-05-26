"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { HOME_REFETCH_EVENT } from "@/lib/homeRefetch";

/**
 * Re-runs `load` when user lands on home (including browser Back from 404).
 */
export function useHomeDataRefetch(
  load: () => void | Promise<void>,
  enabled = true
) {
  const pathname = usePathname();
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      void loadRef.current();
    };

    if (pathname === "/") {
      run();
    }

    const onHomeRefetch = () => run();

    window.addEventListener(HOME_REFETCH_EVENT, onHomeRefetch);

    return () => {
      window.removeEventListener(HOME_REFETCH_EVENT, onHomeRefetch);
    };
  }, [pathname, enabled]);
}
