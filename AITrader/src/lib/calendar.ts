export type EventImpact = "high" | "medium" | "low" | "holiday";

export interface CalendarEvent {
  id: string;
  title: string;
  country: string;
  date: string;
  impact: EventImpact;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  url?: string | null;
}

interface FFEvent {
  title: string;
  country?: string;
  date: string;
  impact?: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  url?: string;
}

const PRIMARY_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const FRESH_TTL_MS = 15 * 60 * 1000;
const MIN_RETRY_AFTER_MS = 5 * 60 * 1000;

let cache: { fetchedAt: number; events: CalendarEvent[] } | null = null;
let cooldownUntil = 0;
let inflight: Promise<CalendarEvent[]> | null = null;

function normalizeImpact(raw: string | undefined): EventImpact {
  const v = (raw ?? "").toLowerCase();
  if (v.startsWith("high")) return "high";
  if (v.startsWith("medium")) return "medium";
  if (v.startsWith("low")) return "low";
  return "holiday";
}

function nullIfBlank(s: string | undefined | null): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  return t.length > 0 ? t : null;
}

async function fetchFromSource(): Promise<CalendarEvent[]> {
  const res = await fetch(PRIMARY_URL, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (SignalForge/1.0) Chrome/120 Safari/537.36",
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "", 10);
    const waitMs = (Number.isFinite(retryAfter) ? retryAfter * 1000 : 0) || MIN_RETRY_AFTER_MS;
    cooldownUntil = Date.now() + waitMs;
    throw new Error(`Calendar rate-limited; retry in ${Math.round(waitMs / 1000)}s`);
  }
  if (!res.ok) {
    throw new Error(`Calendar HTTP ${res.status}`);
  }

  const raw = (await res.json()) as FFEvent[];
  const events: CalendarEvent[] = raw.map((e, i) => ({
    id: `${e.country ?? "X"}-${new Date(e.date).getTime()}-${i}`,
    title: e.title,
    country: (e.country ?? "").toUpperCase(),
    date: new Date(e.date).toISOString(),
    impact: normalizeImpact(e.impact),
    forecast: nullIfBlank(e.forecast),
    previous: nullIfBlank(e.previous),
    actual: nullIfBlank(e.actual),
    url: e.url ?? null,
  }));
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const now = Date.now();

  // Fresh cache — serve directly.
  if (cache && now - cache.fetchedAt < FRESH_TTL_MS) {
    return cache.events;
  }

  // In cooldown from a previous 429 — serve stale cache if we have one.
  if (now < cooldownUntil) {
    if (cache) return cache.events;
    throw new Error(
      `Calendar provider is rate-limiting us; retry in ${Math.round((cooldownUntil - now) / 1000)}s. No cached data yet.`,
    );
  }

  // Dedupe concurrent fetches — only one goes out at a time.
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const events = await fetchFromSource();
      cache = { fetchedAt: Date.now(), events };
      return events;
    } catch (err) {
      // If we have any cache, return stale rather than error.
      if (cache) return cache.events;
      throw err;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Extracts the 3-letter currency codes from a watchlist (forex + metal pairs). */
export function currenciesFromWatchlist(watchlist: string[]): Set<string> {
  const set = new Set<string>();
  for (const p of watchlist) {
    const up = p.toUpperCase().replace(/[^A-Z]/g, "");
    if (up.length === 6) {
      set.add(up.slice(0, 3));
      set.add(up.slice(3));
    } else if (up.startsWith("XAU") || up.startsWith("XAG")) {
      set.add("USD");
    } else if (up === "NAS100" || up === "SPX500" || up === "US30") {
      set.add("USD");
    } else if (up === "DAX" || up === "DAX40" || up === "GER40") {
      set.add("EUR");
    } else if (up === "FTSE" || up === "UK100") {
      set.add("GBP");
    }
  }
  return set;
}

export interface FilterOptions {
  currencies?: string[];
  minImpact?: EventImpact;
  horizonHours?: number;
}

const IMPACT_RANK: Record<EventImpact, number> = { holiday: 0, low: 1, medium: 2, high: 3 };

export function filterEvents(events: CalendarEvent[], opts: FilterOptions = {}): CalendarEvent[] {
  const now = Date.now();
  const horizonMs = (opts.horizonHours ?? 48) * 3600_000;
  const minRank = IMPACT_RANK[opts.minImpact ?? "low"];
  const wanted = opts.currencies ? new Set(opts.currencies.map((c) => c.toUpperCase())) : null;

  return events.filter((e) => {
    const t = new Date(e.date).getTime();
    if (t < now - 30 * 60_000) return false;
    if (t > now + horizonMs) return false;
    if (IMPACT_RANK[e.impact] < minRank) return false;
    if (wanted && !wanted.has(e.country)) return false;
    return true;
  });
}

export function getCacheStatus(): { hasCache: boolean; fetchedAt: number | null; cooldownUntil: number } {
  return {
    hasCache: !!cache,
    fetchedAt: cache?.fetchedAt ?? null,
    cooldownUntil,
  };
}
