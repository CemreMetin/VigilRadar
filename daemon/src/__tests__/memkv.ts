import type { KV } from "../env";

export class MemKV implements KV {
  data = new Map<string, { value: string; metadata: unknown }>();
  puts: string[] = [];
  gets = 0;
  async get(key: string) { this.gets++; return this.data.get(key)?.value ?? null; }
  async getWithMetadata<M>(key: string) { const e = this.data.get(key); return { value: e?.value ?? null, metadata: (e?.metadata ?? null) as M | null }; }
  async put(key: string, value: string, opts?: { metadata?: unknown }) { this.puts.push(key); this.data.set(key, { value, metadata: opts?.metadata }); }
  async delete(key: string) { this.data.delete(key); }
  async list(o: { prefix: string; limit?: number; cursor?: string }) {
    const all = [...this.data.keys()].filter((k) => k.startsWith(o.prefix)).sort();
    const from = o.cursor ? all.findIndex((k) => k > o.cursor!) : 0;
    const rest = from < 0 ? [] : all.slice(from);
    const page = rest.slice(0, o.limit ?? 1000);
    return { keys: page.map((name) => ({ name })), list_complete: page.length === rest.length, cursor: page.at(-1) };
  }
}
