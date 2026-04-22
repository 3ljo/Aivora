"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Filter, Loader2, RefreshCw } from "lucide-react";
import type { CalendarEvent, EventImpact } from "@/lib/calendar";
import { cn } from "@/lib/utils";

interface ApiResponse {
  events: CalendarEvent[];
  totalUnfiltered: number;
  scope: string;
  currencies: string[] | null;
  cachedAt: string | null;
  cooldownUntil: string | null;
  error?: string;
}

const IMPACT_COLOR: Record<EventImpact, { bg: string; ring: string; label: string }> = {
  high: { bg: "bg-red-500", ring: "ring-red-500/30", label: "high" },
  medium: { bg: "bg-amber-500", ring: "ring-amber-500/30", label: "med" },
  low: { bg: "bg-yellow-400", ring: "ring-yellow-400/30", label: "low" },
  holiday: { bg: "bg-slate-500", ring: "ring-slate-500/30", label: "hol" },
};

type ImpactFilter = "high" | "medium" | "low";

export function CalendarPanel({ defaultExpanded = true }: { defaultExpanded?: boolean } = {}) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [scope, setScope] = useState<"watchlist" | "all">("watchlist");
  const [impact, setImpact] = useState<ImpactFilter>("medium");
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar?scope=${scope}&minImpact=${impact}&hours=48`, { cache: "no-store" });
      const data = (await res.json()) as ApiResponse;
      setCooldownUntil(data.cooldownUntil);
      setCachedAt(data.cachedAt ?? null);
      if (!res.ok || data.error) {
        setError(data.error || `HTTP ${res.status}`);
        setEvents([]);
      } else {
        setEvents(data.events || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [scope, impact]);

  // auto-retry once cooldown expires
  useEffect(() => {
    if (!cooldownUntil) return;
    const ms = new Date(cooldownUntil).getTime() - Date.now();
    if (ms <= 0) return;
    const t = setTimeout(() => load(), ms + 500);
    return () => clearTimeout(t);
  }, [cooldownUntil, load]);

  useEffect(() => {
    load();
  }, [load]);

  // update countdowns once a minute
  useEffect(() => {
    const iv = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(iv);
  }, []);

  const grouped = useMemo(() => groupByDay(events), [events, tick]);
  const nextHighImpact = useMemo(() => events.find((e) => e.impact === "high" && new Date(e.date).getTime() > Date.now()), [events, tick]);

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-cyan-400" />
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Economic Calendar</div>
          {!loading && events.length > 0 && (
            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-400">
              {events.length} upcoming
            </span>
          )}
          {nextHighImpact && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
              🔴 {nextHighImpact.country} {nextHighImpact.title.slice(0, 24)}{nextHighImpact.title.length > 24 ? "…" : ""} in {formatCountdown(nextHighImpact.date)}
            </span>
          )}
        </div>
        <div className="text-[10px] text-[color:var(--color-fg-dim)]">{expanded ? "Hide" : "Show"}</div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-[color:var(--color-fg-dim)]">
              <Filter className="h-3 w-3" /> Scope:
            </div>
            <button
              onClick={() => setScope("watchlist")}
              className={cn(
                "rounded-md border px-2 py-0.5",
                scope === "watchlist"
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)]",
              )}
            >
              my watchlist
            </button>
            <button
              onClick={() => setScope("all")}
              className={cn(
                "rounded-md border px-2 py-0.5",
                scope === "all"
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)]",
              )}
            >
              all currencies
            </button>
            <div className="ml-2 flex items-center gap-1 text-[color:var(--color-fg-dim)]">min impact:</div>
            {(["low", "medium", "high"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setImpact(lvl)}
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-0.5",
                  impact === lvl
                    ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)]",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", IMPACT_COLOR[lvl].bg)} />
                {lvl}
              </button>
            ))}
            <button
              onClick={load}
              disabled={loading}
              className="ml-auto flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[color:var(--color-fg-dim)] hover:border-cyan-400"
              title="Refresh"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </button>
          </div>

          {error && (
            <div className={cn(
              "rounded-md border p-2 text-xs",
              cooldownUntil
                ? "border-amber-500/40 bg-amber-500/5 text-amber-300"
                : "border-red-500/40 bg-red-500/10 text-red-300",
            )}>
              <div className="flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3 w-3" />
                {cooldownUntil ? "ForexFactory rate-limited our IP" : "Calendar unavailable"}
              </div>
              <div className="mt-0.5">
                {cooldownUntil
                  ? `Provider will unblock in ${formatCountdown(cooldownUntil)}. We'll retry automatically.`
                  : error}
              </div>
            </div>
          )}

          {loading && events.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-[color:var(--color-fg-dim)]">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-md border border-dashed border-[color:var(--color-border)] p-3 text-center text-xs text-[color:var(--color-fg-dim)]">
              No {impact === "low" ? "" : impact + "-impact "}events in the next 48 hours
              {scope === "watchlist" ? " for your watched currencies" : ""}.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day}>
                  <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-dim)]">
                    {day}
                  </div>
                  <ul className="flex flex-col gap-1">
                    {items.map((e) => (
                      <EventRow key={e.id} event={e} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="text-[10px] text-[color:var(--color-fg-dim)]">Data: ForexFactory · updates every 15 min</div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const c = IMPACT_COLOR[event.impact];
  const when = new Date(event.date);
  const isPast = when.getTime() < Date.now();
  const timeStr = when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const countdown = formatCountdown(event.date);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-xs transition",
        isPast && "opacity-60",
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full ring-4", c.bg, c.ring)} />
      <span className="w-10 shrink-0 font-mono text-[11px] text-[color:var(--color-fg-dim)]">{timeStr}</span>
      <span className="w-10 shrink-0 rounded bg-[color:var(--color-bg)] px-1.5 py-0.5 text-center font-mono text-[10px]">
        {event.country}
      </span>
      <span className="flex-1 truncate">{event.title}</span>
      {(event.actual || event.forecast || event.previous) && (
        <span className="hidden shrink-0 gap-2 font-mono text-[10px] text-[color:var(--color-fg-dim)] sm:flex">
          {event.actual && <span className="text-cyan-400">A: {event.actual}</span>}
          {event.forecast && <span>F: {event.forecast}</span>}
          {event.previous && <span>P: {event.previous}</span>}
        </span>
      )}
      <span className="w-16 shrink-0 text-right font-mono text-[10px] text-[color:var(--color-fg-dim)]">
        {isPast ? "passed" : countdown}
      </span>
    </li>
  );
}

function groupByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const out: Record<string, CalendarEvent[]> = {};
  const now = new Date();
  const today = dayKey(now);
  const tomorrow = dayKey(new Date(now.getTime() + 86_400_000));
  for (const e of events) {
    const d = new Date(e.date);
    const key = dayKey(d);
    const label = key === today ? "Today" : key === tomorrow ? "Tomorrow" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    if (!out[label]) out[label] = [];
    out[label].push(e);
  }
  return out;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatCountdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) return `${hours}h${rem > 0 ? ` ${rem}m` : ""}`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
