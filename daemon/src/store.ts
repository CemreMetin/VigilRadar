import type { KV } from "./env";

export const MAX_WRITES_PER_TURN = 10; // VIGIL.md 6.2: the free plan allows 1000 KV writes a day

/** KV access with a write budget per cron turn. Writes over the budget are refused (returns false) and left to the next turn. */
export class Store {
  writes = 0;
  constructor(private kv: KV, private max = MAX_WRITES_PER_TURN) {}

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.kv.get(key);
    if (raw === null) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }

  /** One read gives the value and the content hash it was stored with. */
  async getWithHash<T>(key: string): Promise<{ value: T | null; hash: string | null }> {
    const { value, metadata } = await this.kv.getWithMetadata<{ hash?: string }>(key);
    try { return { value: value === null ? null : (JSON.parse(value) as T), hash: metadata?.hash ?? null }; } catch { return { value: null, hash: null }; }
  }

  async put(key: string, value: unknown, opts: { hash?: string; expirationTtl?: number } = {}): Promise<boolean> {
    if (this.writes >= this.max) return false;
    this.writes++;
    await this.kv.put(key, JSON.stringify(value), { expirationTtl: opts.expirationTtl, metadata: opts.hash ? { hash: opts.hash } : undefined });
    return true;
  }
}

/** Short content hash (FNV-1a, 32 bit). Collisions only cost one skipped write, the next change fixes it. */
export function hashOf(value: unknown): string {
  const s = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}
