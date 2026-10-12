import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { KIND_SOURCE, type Alert, type AlertsFile } from "../lib/alerts";
import { RULE_TEXT, kpAlerts, quakeAlerts, tsunamiAlerts } from "./alerts/rules";
import { fetchBulletins, fetchKp, fetchQuakes } from "./alerts/sources";
import { dashboardLink, formatMessage, sendTelegram } from "./alerts/telegram";

/**
 * Alert engine. Run by GitHub Actions every 5 minutes (.github/workflows/alerts.yml) and by hand:
 *   npm run alerts              evaluate and, if the secrets are set, broadcast new CRITICAL alerts to Telegram
 *   npm run alerts -- --dry     print what would be sent
 *   npm run alerts -- --no-send evaluate only (used by the main data job)
 * Stateless apart from one small JSON file (the ids already sent, and the last active set), which CI keeps in
 * the Actions cache. Without it the engine would re-send on every run; with it a lost cache costs at most one
 * repeated message, because only events from the last SEND_WINDOW_H hours are ever sent.
 */

const DRY = process.argv.includes("--dry");
const NO_SEND = process.argv.includes("--no-send");
const SITE = process.env.SITE_URL ?? "https://monitoring-9l7.pages.dev";
const SEND_WINDOW_H = 3;
const STATE = path.join(process.cwd(), ".cache", "alerts", "state.json");
const OUT = path.join(process.cwd(), "public", "data", "alerts.json");

type State = { sent: Record<string, string>; active: Alert[] };

async function loadState(): Promise<State> {
  try {
    return JSON.parse(await readFile(STATE, "utf8")) as State;
  } catch {
    return { sent: {}, active: [] };
  }
}

async function main() {
  const now = Date.now();
  const state = await loadState();
  const failed = new Set<string>();
  const current: Alert[] = [];

  const run = async <T>(source: "usgs" | "tsunami" | "swpc", load: () => Promise<T>, rules: (x: T) => Alert[]) => {
    try {
      current.push(...rules(await load()));
    } catch (e) {
      failed.add(source);
      console.warn(`source ${source} failed: ${e instanceof Error ? e.message : e}`);
    }
  };
  await Promise.all([
    run("usgs", fetchQuakes, (q) => quakeAlerts(q, now)),
    run("tsunami", fetchBulletins, (b) => tsunamiAlerts(b, now)),
    run("swpc", fetchKp, (k) => kpAlerts(k, now)),
  ]);

  // a failed source must not silently clear its alarms: keep its previous, unexpired alerts
  for (const prev of state.active) {
    if (failed.has(KIND_SOURCE[prev.kind]) && Date.parse(prev.expiresAt) > now) current.push(prev);
  }
  const active = [...new Map(current.map((a) => [a.id, a])).values()].sort((a, b) => b.at.localeCompare(a.at));

  // broadcast new CRITICAL alerts
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  const sendable = active.filter((a) => a.level === "critical" && !state.sent[a.id] && now - Date.parse(a.at) <= SEND_WINDOW_H * 3_600_000);
  for (const a of sendable) {
    const text = formatMessage(a, SITE);
    if (DRY) {
      console.log(`--- would send (${a.id}) ---\n${text}\n`);
    } else if (NO_SEND) {
      continue;
    } else if (!token || !chat) {
      console.warn(`CRITICAL alert ${a.id} not broadcast: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set`);
    } else {
      try {
        await sendTelegram(token, chat, text);
        state.sent[a.id] = new Date().toISOString();
        console.log(`sent ${a.id} -> ${dashboardLink(a, SITE)}`);
      } catch (e) {
        console.error(`send failed for ${a.id}: ${e instanceof Error ? e.message : e}`); // retried on the next run
      }
    }
  }

  // forget sent ids after a week
  for (const [id, t] of Object.entries(state.sent)) if (now - Date.parse(t) > 7 * 86_400_000) delete state.sent[id];

  const file: AlertsFile = { generatedAt: new Date(now).toISOString(), rules: RULE_TEXT, active };
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(file));
  if (!DRY) {
    await mkdir(path.dirname(STATE), { recursive: true });
    await writeFile(STATE, JSON.stringify({ sent: state.sent, active }));
  }
  console.log(`alerts: ${active.filter((a) => a.level === "critical").length} critical, ${active.filter((a) => a.level === "notice").length} notice${failed.size ? `, failed sources: ${[...failed].join(", ")}` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
