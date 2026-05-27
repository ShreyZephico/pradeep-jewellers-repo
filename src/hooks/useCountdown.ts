"use client";

import { useEffect, useState } from "react";

import {
  msToCountdownParts,
  resolveCountdownEndMs,
  type CountdownParts,
  type ResolvedClearanceCountdown,
} from "@/lib/goldSchemeCountdown";

export type UseCountdownResult = CountdownParts & {
  /** False until the client has computed the first tick (avoids stuck 00:00 flash). */
  isReady: boolean;
  /** True when countdown is missing or not valid. */
  isInvalid: boolean;
};

export function useCountdown(
  config: ResolvedClearanceCountdown
): UseCountdownResult {
  const [endMs, setEndMs] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const resolvedEnd = resolveCountdownEndMs(config);
    setEndMs(resolvedEnd);

    if (resolvedEnd === null) {
      setRemainingMs(0);
      return;
    }

    const tick = () => setRemainingMs(Math.max(0, resolvedEnd - Date.now()));
    tick();

    const intervalId = window.setInterval(tick, 1000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [config.endsAt, config.daysLeft, config.isConfigured]);

  const parts = msToCountdownParts(remainingMs ?? 0);

  return {
    ...parts,
    isReady: remainingMs !== null,
    isInvalid:
      config.isConfigured && remainingMs !== null && endMs === null,
  };
}
