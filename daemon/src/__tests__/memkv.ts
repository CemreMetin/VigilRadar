import type { KV } from "../env";

export class MemKV implements KV {
  data = new Map<string, { value: string; metadata: unknown }>();
  puts: string[] = [];
  gets = 0;
  async get(key: string) { this.gets++; return this.data.get(key)?.value ?? null; }
  async getWithMetadata<M>(key: string) { const e = this.data.get(key); return { value: e?.value ?? null, metadata: (e?.metadata ?? null) as M | null }; }
  async put(key: string, value: string, opts?: { metadata?: unknown }) { this.puts.push(key); this.data.set(key, { value, metadata: opts?.metadata }); }
}
