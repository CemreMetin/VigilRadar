import { CONFIG } from "../../../core/config";
import type { State } from "../../../core/types";
import type { Env } from "../env";
import { Store, hashOf } from "../store";
import type { StoredSub } from "../subs";
import { compose } from "./message";
import { EMPTY_LOG, plan, type Notice, type NotifyLog } from "./policy";
import { sendTelegram } from "./telegram";
import { sendPush } from "./webpush";

// Dispatcher (VIGIL.md 6.1 / 7): runs the policy on the turn's state and delivers what is due.
// All bookkeeping lives in ONE KV document, `notif`, written only when it changes (VIGIL.md 6.2 lists `sent:` and
// `pushq:` keys; one document costs 1-2 writes per turn instead of one per notice, see docs/DECISIONS.md).

interface TgItem { chat: "TR" | "GLOBAL"; text: string; tries: number }
interface PushJob { id: string; notice: Notice; region: string; cursor: string | null }
interface Notif { log: NotifyLog; tg: TgItem[]; push: PushJob[] }

const EMPTY: Notif = { log: EMPTY_LOG, tg: [], push: [] };
const MAX_TG_TRIES = 2; // the first send and one retry on the next turn

export const channels = (env: Env) => ({
  telegram: !!env.TELEGRAM_BOT_TOKEN && !!(env.TELEGRAM_CHAT_TR || env.TELEGRAM_CHAT_GLOBAL),
  push: !!env.VAPID_PRIVATE_KEY && !!env.VAPID_PUBLIC_KEY && !!env.VAPID_SUBJECT,
});

/** Never throws: a channel without its secrets stays closed, and a failed delivery waits for the next turn. */
export async function dispatch(env: Env, store: Store, state: State, nowMs: number): Promise<void> {
  const on = channels(env);
  if (!on.telegram && !on.push) return;
  const site = env.SITE_URL ?? "";
  const before = (await store.getJson<Notif>("notif")) ?? EMPTY;
  const beforeHash = hashOf(before);

  const { notices, log } = plan({ nowMs, quakes: state.quakes, levels: state.provinceLevels, tsunami: state.tsunami, log: before.log });
  const doc: Notif = { log, tg: [...before.tg], push: [...before.push] };

  for (const n of notices) {
    if (on.telegram) {
      const chat = n.scope === "TR" ? "TR" : "GLOBAL";
      if (chat === "TR" ? env.TELEGRAM_CHAT_TR : env.TELEGRAM_CHAT_GLOBAL) {
        const m = compose(n, chat === "TR" ? "tr" : "en", site, { telegram: true });
        doc.tg.push({ chat, text: `${m.title}\n${m.body}`, tries: 0 });
      }
    }
    if (on.push) {
      const regions = n.scope === "GLOBAL" ? ["GLOBAL"] : n.provinces.map((p) => p.code);
      for (const region of regions) doc.push.push({ id: `${n.key}:${region}`, notice: n, region, cursor: null });
    }
  }

  // Persist the plan first, so a crash while sending repeats a message instead of losing one.
  if (hashOf(doc) !== beforeHash) await store.put("notif", doc);
  const afterPlan = hashOf(doc);

  if (on.telegram) {
    const keep: TgItem[] = [];
    await Promise.all(doc.tg.map(async (it) => {
      const chatId = it.chat === "TR" ? env.TELEGRAM_CHAT_TR : env.TELEGRAM_CHAT_GLOBAL;
      if (!chatId || (await sendTelegram(env.TELEGRAM_BOT_TOKEN!, chatId, it.text))) return;
      if (it.tries + 1 < MAX_TG_TRIES) keep.push({ ...it, tries: it.tries + 1 });
    }));
    doc.tg = keep;
  } else doc.tg = [];

  if (on.push) doc.push = await deliverPush(env, store, doc.push, site, nowMs);
  else doc.push = [];

  if (hashOf(doc) !== afterPlan) await store.put("notif", doc);
}

/** Sends to at most CONFIG.notify.pushBatch subscribers this turn; the job keeps its `list` cursor for the next one. */
async function deliverPush(env: Env, store: Store, jobs: PushJob[], site: string, nowMs: number): Promise<PushJob[]> {
  let budget = CONFIG.notify.pushBatch;
  const left: PushJob[] = [];
  for (const job of jobs) {
    if (budget <= 0) { left.push(job); continue; }
    const page = await store.list(`sub:${job.region}:`, budget, job.cursor ?? undefined);
    const level = job.notice.scope === "GLOBAL" ? "P0" : job.notice.provinces.find((p) => p.code === job.region)?.sev ?? "P1";
    await Promise.all(page.keys.map(async ({ name }) => {
      const raw = await store.get(name);
      if (!raw) return;
      let sub: StoredSub;
      try { sub = JSON.parse(raw) as StoredSub; } catch { return; }
      const m = compose(job.notice, sub.lang, site, { province: job.region });
      const r = await sendPush({ publicKey: env.VAPID_PUBLIC_KEY!, privateJwk: env.VAPID_PRIVATE_KEY!, subject: env.VAPID_SUBJECT! }, sub, { id: job.notice.eventId, level, title: m.title, body: m.body, url: m.url }, nowMs);
      if (r === "gone") { await store.delete(name); await store.delete(`ep:${name.split(":")[2]}`); }
    }));
    budget -= page.keys.length;
    if (!page.list_complete && page.cursor) left.push({ ...job, cursor: page.cursor });
  }
  return left;
}
