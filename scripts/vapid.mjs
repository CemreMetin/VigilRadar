// Generates a VAPID key pair for Web Push (RFC 8292). Prints the two values to enter as Worker secrets; stores nothing.
//   node scripts/vapid.mjs
const { publicKey, privateKey } = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const raw = Buffer.from(await crypto.subtle.exportKey("raw", publicKey)).toString("base64url");
const jwk = await crypto.subtle.exportKey("jwk", privateKey);
console.log("VAPID_PUBLIC_KEY  =", raw);
console.log("VAPID_PRIVATE_KEY =", JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }));
