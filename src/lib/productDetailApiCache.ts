const TTL_MS = 120_000;

type CacheEntry = {
  body: string;
  expires: number;
};

const cache = new Map<string, CacheEntry>();

export function readProductDetailApiCache(slug: string): string | null {
  const entry = cache.get(slug);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(slug);
    return null;
  }
  return entry.body;
}

export function writeProductDetailApiCache(slug: string, body: string): void {
  cache.set(slug, { body, expires: Date.now() + TTL_MS });
  if (cache.size > 80) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].expires - b[1].expires);
    for (let i = 0; i < 15; i += 1) {
      cache.delete(oldest[i][0]);
    }
  }
}
