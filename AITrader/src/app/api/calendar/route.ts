import { NextRequest, NextResponse } from "next/server";
import {
  currenciesFromWatchlist,
  filterEvents,
  getCacheStatus,
  getCalendarEvents,
  type EventImpact,
} from "@/lib/calendar";
import { readSettings } from "@/lib/alerts/settings";
import { DEFAULT_PROFILE } from "@/lib/profile";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const impactParam = (url.searchParams.get("minImpact") ?? "medium") as EventImpact;
  const horizonHours = parseInt(url.searchParams.get("hours") ?? "48", 10);
  const scopeParam = url.searchParams.get("scope") ?? "watchlist";

  try {
    const events = await getCalendarEvents();

    let currencies: string[] | undefined;
    if (scopeParam === "watchlist") {
      const settings = await readSettings();
      const watchlist = settings.profile?.watchlist ?? DEFAULT_PROFILE.watchlist;
      const set = currenciesFromWatchlist(watchlist);
      currencies = Array.from(set);
    }

    const filtered = filterEvents(events, {
      currencies,
      minImpact: impactParam,
      horizonHours: Number.isFinite(horizonHours) ? horizonHours : 48,
    });

    const status = getCacheStatus();
    return NextResponse.json({
      events: filtered,
      totalUnfiltered: events.length,
      scope: scopeParam,
      currencies: currencies ?? null,
      source: "forexfactory",
      cachedAt: status.fetchedAt ? new Date(status.fetchedAt).toISOString() : null,
      cooldownUntil: status.cooldownUntil > Date.now() ? new Date(status.cooldownUntil).toISOString() : null,
    });
  } catch (err) {
    const status = getCacheStatus();
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        cooldownUntil: status.cooldownUntil > Date.now() ? new Date(status.cooldownUntil).toISOString() : null,
      },
      { status: 503 },
    );
  }
}
