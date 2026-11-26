import type { State } from "../../../core/types";
import type { Env } from "../env";
import { Store, hashOf } from "../store";
import { compose } from "./message";
import { EMPTY_LOG, plan, type NotifyLog } from "./policy";
import { sendTelegram } from "./telegram";

// Dispatcher (VIGIL.md 6.1 / 7): runs the policy on the turn's state and delivers what is due to the optional
// Telegram channels. All bookkeeping lives in ONE KV document, `notif`, written only when it changes.

interface TgItem { chat: "TR" | "GLOBAL"; text: string; tries: number }
interface Notif { log: NotifyLog; tg: TgItem[] }

const EMPTY: Notif = { log: EMPTY_LOG, tg: [] };
const MAX_TG_TRIES = 2; // the first send and one retry on the next turn

export const telegramOn = (env: Env) => !!env.TELEGRAM_BOT_TOKEN && !!(env.TELEGRAM_CHAT_TR || env.TELEGRAM_CHAT_GLOBAL);

/** Never throws: without the secrets nothing is read or written, and a failed delivery waits for the next turn. */
export async function dispatch(env: Env, store: Store, state: State, nowMs: number): Promise<void> {
  if (!telegramOn(env)) return;
  const site = env.SITE_URL ?? "";
  const before = (await store.getJson<Notif>("notif")) ?? EMPTY;
  const beforeHash = hashOf(before);

  const { notices, log } = plan({ nowMs, quakes: state.quakes, levels: state.provinceLevels, tsunami: state.tsunami, log: before.log });
  const doc: Notif = { log, tg: [...before.tg] };

  for (const n of notices) {
    const chat = n.scope === "TR" ? "TR" : "GLOBAL";
    if (!(chat === "TR" ? env.TELEGRAM_CHAT_TR : env.TELEGRAM_CHAT_GLOBAL)) continue;
    const m = compose(n, chat === "TR" ? "tr" : "en", site);
    doc.tg.push({ chat, text: `${m.title}\n${m.body}`, tries: 0 });
  }

  // Persist the plan first, so a crash while sending repeats a message instead of losing one.
  if (hashOf(doc) !== beforeHash) await store.put("notif", doc);
  const afterPlan = hashOf(doc);

  const keep: TgItem[] = [];
  await Promise.all(doc.tg.map(async (it) => {
    const chatId = it.chat === "TR" ? env.TELEGRAM_CHAT_TR : env.TELEGRAM_CHAT_GLOBAL;
    if (!chatId || (await sendTelegram(env.TELEGRAM_BOT_TOKEN!, chatId, it.text))) return;
    if (it.tries + 1 < MAX_TG_TRIES) keep.push({ ...it, tries: it.tries + 1 });
  }));
  doc.tg = keep;

  if (hashOf(doc) !== afterPlan) await store.put("notif", doc);
}
