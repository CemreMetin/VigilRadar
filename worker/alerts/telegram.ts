import type { Alert } from "../../lib/alerts";

/**
 * Telegram broadcast, stateless: one POST per alert to a channel or chat. No subscriber list, no tokens
 * stored anywhere but the two repository secrets TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
 * Setup: create a bot with @BotFather, add it as an administrator of your channel, put the bot token and the
 * channel id (for example @my_channel, or a number for a private chat) in the GitHub secrets.
 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function dashboardLink(a: Alert, site: string): string {
  const p = new URLSearchParams({ sc: a.scenario });
  if (a.entityId) p.set("sel", a.entityId);
  return `${site.replace(/\/$/, "")}/?${p}`;
}

/** The message text (HTML parse mode). Pure, so it can be tested and printed in dry runs. */
export function formatMessage(a: Alert, site: string): string {
  const when = a.at.replace("T", " ").slice(0, 16) + " UTC";
  const coords =
    a.lat !== undefined && a.lon !== undefined
      ? `${a.lat.toFixed(3)}, ${a.lon.toFixed(3)} (<a href="https://www.openstreetmap.org/?mlat=${a.lat}&amp;mlon=${a.lon}#map=6/${a.lat}/${a.lon}">map</a>)`
      : "not stated by the source";
  return [
    `<b>${a.level.toUpperCase()} · ${esc(a.title)}</b>`,
    esc(a.detail),
    "",
    `Event type: ${a.kind}`,
    `Severity: ${a.level.toUpperCase()} (rule: ${esc(a.rule)})`,
    `Coordinates: ${coords}`,
    `Time: ${when}`,
    `Source: <a href="${esc(a.sourceUrl)}">${esc(a.sourceName)}</a>`,
    `Dashboard: <a href="${esc(dashboardLink(a, site))}">open the ${esc(a.scenario)} tab</a>`,
    "",
    "Automatic message from published data; figures can be revised. Not an official warning: follow your national authority.",
  ].join("\n");
}

export async function sendTelegram(token: string, chatId: string, text: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    // never echo the token: report only Telegram's own description
    const body = (await res.json().catch(() => ({}))) as { description?: string };
    throw new Error(`Telegram HTTP ${res.status}${body.description ? `: ${body.description}` : ""}`);
  }
}
