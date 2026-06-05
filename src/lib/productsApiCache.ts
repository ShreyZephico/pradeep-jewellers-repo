const TTL_MS = 90_000;

type CacheEntry = {
  body: string;
  expires: number;
};

const cache = new Map<string, CacheEntry>();

export function readProductsApiCache(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.body;
}

export function writeProductsApiCache(key: string, body: string): void {
  cache.set(key, { body, expires: Date.now() + TTL_MS });
  if (cache.size > 40) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].expires - b[1].expires);
    for (let i = 0; i < 10; i += 1) {
      cache.delete(oldest[i][0]);
    }
  }
}
