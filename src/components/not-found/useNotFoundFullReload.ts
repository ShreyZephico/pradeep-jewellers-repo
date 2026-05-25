"use client";

import { useEffect } from "react";

import { markWasOnNotFoundPage } from "@/lib/homeRefetch";

/** Marks 404 visit; Back handling runs in root NavigationGuard (never unmounts). */
export function useNotFoundFullReload() {
  useEffect(() => {
    document.body.classList.add("is-not-found-page");
    markWasOnNotFoundPage();

    return () => {
      document.body.classList.remove("is-not-found-page");
    };
  }, []);
}

export function navigateWithFullReload(href: string) {
  window.location.assign(href);
}
