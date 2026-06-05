"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const VisitorLocationTracker = dynamic(
  () => import("@/components/analytics/VisitorLocationTracker"),
  { ssr: false }
);

const GoogleOneTapShell = dynamic(
  () => import("@/components/GoogleOneTapShell"),
  { ssr: false }
);

const TawkToChat = dynamic(() => import("@/components/TawkToChat"), {
  ssr: false,
});

const DEFER_MS = 3_000;

export default function DeferredSiteExtras() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const activate = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(activate, { timeout: DEFER_MS });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timerId = window.setTimeout(activate, DEFER_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <VisitorLocationTracker />
      <GoogleOneTapShell />
      <TawkToChat />
    </>
  );
}
