export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_MONITOR === "1") return;

  const intervalMs = parseInt(process.env.MONITOR_INTERVAL_MS || "60000", 10);
  const safeInterval = Number.isFinite(intervalMs) && intervalMs >= 10_000 ? intervalMs : 60_000;

  const GLOBAL_KEY = "__signalforge_monitor_interval__";
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: NodeJS.Timeout };
  if (g[GLOBAL_KEY]) clearInterval(g[GLOBAL_KEY]);

  const port = process.env.PORT || "3000";
  const base = process.env.MONITOR_BASE_URL || `http://127.0.0.1:${port}`;
  const token = process.env.CRON_SECRET;
  const url = token
    ? `${base}/api/cron/tick?token=${encodeURIComponent(token)}`
    : `${base}/api/cron/tick`;

  g[GLOBAL_KEY] = setInterval(() => {
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.fired > 0) console.log(`[alerts monitor] fired ${j.fired} of ${j.checked}`);
        if (Array.isArray(j?.errors) && j.errors.length) console.warn(`[alerts monitor] errors:`, j.errors);
      })
      .catch((err) => {
        console.error("[alerts monitor] tick request failed:", err instanceof Error ? err.message : err);
      });
  }, safeInterval);

  console.log(`[alerts monitor] scheduled — ticking ${url} every ${safeInterval / 1000}s`);
}
