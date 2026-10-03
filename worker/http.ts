/** Polite, identifiable fetch for open data servers (some, like NASA GISS, reject the default UA). */
export const USER_AGENT = "monitoring-dashboard/0.1 (personal, non-commercial project)";

export async function fetchOpen(url: string, timeoutMs = 30_000): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json,text/csv,text/plain,*/*" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}
