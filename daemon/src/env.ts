// Minimal shapes of the Cloudflare runtime objects the daemon touches, so no types package is needed.
export interface KV {
  get(key: string, type?: "text"): Promise<string | null>;
  getWithMetadata<M>(key: string, type?: "text"): Promise<{ value: string | null; metadata: M | null }>;
  put(key: string, value: string, opts?: { expirationTtl?: number; metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list(opts: { prefix: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

export interface Env {
  VIGIL: KV;
  ALLOWED_ORIGINS?: string;
  SITE_URL?: string;
  INGEST_TOKEN?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_TR?: string;
  TELEGRAM_CHAT_GLOBAL?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
}
