"use client";

// Web Push subscription (VIGIL.md 6.3 / 7.4). Only the push endpoint, the chosen region and the language go to the Worker.

const WORKER = process.env.NEXT_PUBLIC_WORKER_URL?.replace(/\/$/, "");
export type PushOutcome = "ok" | "unsupported" | "denied" | "noserver" | "offline";

export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
/** iOS delivers Web Push only to a site added to the Home Screen. */
export const iosNeedsInstall = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(navigator as unknown as { standalone?: boolean }).standalone;

const b64uToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function registration() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  try { return await (await registration()).pushManager.getSubscription(); } catch { return null; }
}

export async function enablePush(region: string, lang: "tr" | "en"): Promise<PushOutcome> {
  if (!pushSupported()) return "unsupported";
  if (!WORKER) return "noserver";
  let key: string;
  try {
    const r = await fetch(`${WORKER}/v1/vapid`);
    if (r.status === 404) return "noserver";
    if (!r.ok) return "offline";
    key = ((await r.json()) as { publicKey: string }).publicKey;
  } catch { return "offline"; }
  if ((await Notification.requestPermission()) !== "granted") return "denied";
  try {
    const reg = await registration();
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(key) }));
    const res = await fetch(`${WORKER}/v1/push/subscribe`, { method: "POST", body: JSON.stringify({ subscription: sub.toJSON(), region, lang }) });
    return res.ok ? "ok" : "offline";
  } catch { return "offline"; }
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  if (WORKER) await fetch(`${WORKER}/v1/push/unsubscribe`, { method: "POST", body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}
