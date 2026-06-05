import {
  normalizeIpAddress,
  resolvePublicClientIp,
} from "@/lib/ipGeolocation";

/** Client IP from reverse-proxy headers (Vercel, ngrok, nginx, Cloudflare). */
export function clientIpFromRequest(request: Request): string {
  return resolvePublicClientIp(request);
}

export { normalizeIpAddress };
