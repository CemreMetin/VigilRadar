import { describe, expect, it } from "vitest";
import { encryptPayload, fromB64u, vapidHeader } from "../notify/webpush";

// RFC 8291 Appendix A: the worked example of aes128gcm message encryption.
const A = {
  plain: "When I grow up, I want to be a watermelon",
  asPrivate: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
  asPublic: "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
  uaPrivate: "q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94",
  uaPublic: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
  auth: "BTBZMqHH6r4Tts7J_aSIgg",
  salt: "DGv6ra1nlYgDCS1FRnbzlw",
  body: "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
};
const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64url");
const jwkOf = (priv: string, pub: string) => { const p = fromB64u(pub); return { kty: "EC", crv: "P-256", d: priv, x: b64(p.slice(1, 33)), y: b64(p.slice(33, 65)) }; };

describe("RFC 8291 Appendix A", () => {
  it("reproduces the example body byte for byte", async () => {
    const out = await encryptPayload(new TextEncoder().encode(A.plain), fromB64u(A.uaPublic), fromB64u(A.auth), { asPrivateJwk: jwkOf(A.asPrivate, A.asPublic), salt: fromB64u(A.salt) });
    expect(b64(out)).toBe(A.body);
  });
  it("the user agent can decrypt a fresh random-key message with its private key", async () => {
    const msg = JSON.stringify({ title: "M6.4 DEPREM", body: "İlinde yıkıcı olabilir." });
    const out = await encryptPayload(new TextEncoder().encode(msg), fromB64u(A.uaPublic), fromB64u(A.auth));
    const salt = out.slice(0, 16), idlen = out[20], asPub = out.slice(21, 21 + idlen), cipher = out.slice(21 + idlen);
    const ecdh = { name: "ECDH", namedCurve: "P-256" } as const;
    const ua = await crypto.subtle.importKey("jwk", jwkOf(A.uaPrivate, A.uaPublic), ecdh, false, ["deriveBits"]);
    const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: await crypto.subtle.importKey("raw", asPub, ecdh, false, []) }, ua, 256));
    const hk = async (s: BufferSource, ikm: BufferSource, info: BufferSource, n: number) => new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: s, info }, await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]), n * 8));
    const te = new TextEncoder();
    const ikm = await hk(fromB64u(A.auth), secret, new Uint8Array([...te.encode("WebPush: info\0"), ...fromB64u(A.uaPublic), ...asPub]), 32);
    const cek = await hk(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
    const nonce = await hk(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(nonce) }, await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]), new Uint8Array(cipher)));
    expect(new TextDecoder().decode(plain.slice(0, -1))).toBe(msg);
    expect(plain.at(-1)).toBe(2);
  });
});

describe("RFC 8292 VAPID", () => {
  it("signs an ES256 JWT for the push service origin that verifies with the public key", async () => {
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
    const pub = b64(new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey)));
    const now = Date.UTC(2026, 10, 18, 12);
    const h = await vapidHeader("https://fcm.googleapis.com/fcm/send/abc", { publicKey: pub, privateJwk: JSON.stringify(jwk), subject: "mailto:a@b.test" }, now);
    const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(h)!;
    expect(m[4]).toBe(pub);
    const claims = JSON.parse(Buffer.from(m[2], "base64url").toString());
    expect(claims).toEqual({ aud: "https://fcm.googleapis.com", exp: now / 1000 + 43200, sub: "mailto:a@b.test" });
    expect(JSON.parse(Buffer.from(m[1], "base64url").toString())).toEqual({ typ: "JWT", alg: "ES256" });
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, kp.publicKey, fromB64u(m[3]), new TextEncoder().encode(`${m[1]}.${m[2]}`));
    expect(ok).toBe(true);
  });
});
