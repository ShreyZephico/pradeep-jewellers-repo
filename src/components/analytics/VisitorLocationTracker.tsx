"use client";

import { useEffect } from "react";

import type { IpInfoPayload } from "@/lib/ipGeolocation";

const SESSION_KEY = "pj_visitor_session_id";
const TRACKED_KEY = "pj_visitor_location_tracked";
const TRACK_DELAY_MS = 3_000;
const IPINFO_URL = "https://ipinfo.io/json";

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 8) return existing;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }
}

function isAlreadyTracked(): boolean {
  try {
    return sessionStorage.getItem(TRACKED_KEY) === "1";
  } catch {
    return false;
  }
}

function markTracked(): void {
  try {
    sessionStorage.setItem(TRACKED_KEY, "1");
  } catch {
    /* ignore */
  }
}

async function fetchIpInfo(): Promise<IpInfoPayload | null> {
  try {
    const response = await fetch(IPINFO_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as IpInfoPayload;
  } catch {
    return null;
  }
}

async function sendVisit(): Promise<boolean> {
  const sessionId = getOrCreateSessionId();
  const sourcePage = `${window.location.pathname}${window.location.search}`;
  const referrer = document.referrer || undefined;
  const ipInfo = await fetchIpInfo();

  const res = await fetch("/api/visitor-location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify({
      session_id: sessionId,
      source_page: sourcePage,
      referrer,
      ip: ipInfo?.ip,
      city: ipInfo?.city,
      region: ipInfo?.region,
      country: ipInfo?.country,
      loc: ipInfo?.loc,
      postal: ipInfo?.postal,
      timezone: ipInfo?.timezone,
    }),
  });

  const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
  return Boolean(res.ok && json?.ok);
}

/** One visit per session — geo from ipinfo.io/json */
export default function VisitorLocationTracker() {
  useEffect(() => {
    if (isAlreadyTracked()) return;

    const timer = window.setTimeout(() => {
      void sendVisit()
        .then((ok) => {
          if (ok) markTracked();
        })
        .catch(() => {
          /* silent */
        });
    }, TRACK_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
