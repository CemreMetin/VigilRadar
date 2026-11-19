import { CONFIG } from "../../../core/config";

// Web Push by hand (VIGIL.md 7.4): message encryption RFC 8291 (aes128gcm) and VAPID RFC 8292, both with WebCrypto.
// @pushforge/builder was tried and dropped: it sends the obsolete `aesgcm` encoding, which Safari/iOS does not accept.

export interface Sub { endpoint: string; keys: { p256dh: string; auth: string } }
export interface PushPayload { id: string; level: "P0" | "P1"; title: string; body: string; url: string }
export interface Vapid { publicKey: string; privateJwk: string; subject: string }
export type PushResult = "ok" | "gone" | "error"; // gone: the push service says the subscription no longer exists (404/410)

type U8 = Uint8Array<ArrayBuffer>;
const enc = new TextEncoder();
const b64u = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const fromB64u = (s: string): U8 => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const cat = (...a: Uint8Array[]): U8 => { const o = new Uint8Array(new ArrayBuffer(a.reduce((n, x) => n + x.length, 0))); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };

async function hkdf(salt: U8, ikm: U8, info: U8, bytes: number): Promise<U8> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8));
}

/** RFC 8291 section 3: the aes128gcm body (header + one record) for one message. The key pair and salt are injectable for the RFC test vector. */
export async function encryptPayload(plain: U8, uaPublic: U8, authSecret: U8, fixed?: { asPrivateJwk: JsonWebKey; salt: U8 }): Promise<U8> {
  const ecdh = { name: "ECDH", namedCurve: "P-256" } as const;
  let asPriv: CryptoKey, asPub: U8;
  if (fixed) {
    asPriv = await crypto.subtle.importKey("jwk", fixed.asPrivateJwk, ecdh, true, ["deriveBits"]);
    asPub = cat(new Uint8Array([4]), fromB64u(fixed.asPrivateJwk.x!), fromB64u(fixed.asPrivateJwk.y!));
  } else {
    const kp = await crypto.subtle.generateKey(ecdh, true, ["deriveBits"]);
    asPriv = kp.privateKey;
    asPub = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  }
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, ecdh, false, []);
  const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPriv, 256));
  const ikm = await hkdf(authSecret, secret, cat(enc.encode("WebPush: info\0"), uaPublic, asPub), 32);
  const salt = fixed?.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const record = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, cat(plain, new Uint8Array([2])))); // 0x02: last record, no padding
  const rs = new Uint8Array([0, 0, 0x10, 0]); // record size 4096
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, record);
}

/** RFC 8292: the `Authorization: vapid t=<jwt>, k=<public key>` header value, a JWT signed ES256 for the push service's origin. */
export async function vapidHeader(endpoint: string, v: Vapid, nowMs: number): Promise<string> {
  const part = (o: object) => b64u(enc.encode(JSON.stringify(o)));
  const input = `${part({ typ: "JWT", alg: "ES256" })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(nowMs / 1000) + 12 * 3600, sub: v.subject })}`;
  const key = await crypto.subtle.importKey("jwk", JSON.parse(v.privateJwk), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(input))); // already r||s
  return `vapid t=${input}.${b64u(sig)}, k=${v.publicKey}`;
}

export async function sendPush(v: Vapid, sub: Sub, payload: PushPayload, nowMs = Date.now()): Promise<PushResult> {
  try {
    const body = await encryptPayload(enc.encode(JSON.stringify(payload)), fromB64u(sub.keys.p256dh), fromB64u(sub.keys.auth));
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: { Authorization: await vapidHeader(sub.endpoint, v, nowMs), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: String(CONFIG.notify.pushTtlSec), Urgency: "high" },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "ok" : "error";
  } catch { return "error"; }
}
