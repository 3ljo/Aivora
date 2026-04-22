"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, User } from "lucide-react";
import { TOP_PAIRS_BY_CLASS } from "@/lib/profile";
import { STRATEGY_INFO, type StrategyStyle, type TradingProfile, type TradingSession, type TradingStrategy } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Array<{ value: StrategyStyle; label: string }> = [
  { value: "scalp", label: "Scalp" },
  { value: "day", label: "Day" },
  { value: "swing", label: "Swing" },
  { value: "position", label: "Position" },
];

const STRATEGY_ORDER: TradingStrategy[] = [
  "price-action",
  "supply-demand",
  "smc",
  "rsi-momentum",
  "ma-trend",
  "support-resistance",
  "breakout",
  "fibonacci",
  "mean-reversion",
];

const SESSIONS: Array<{ value: TradingSession; label: string }> = [
  { value: "sydney", label: "Sydney" },
  { value: "tokyo", label: "Tokyo" },
  { value: "london", label: "London" },
  { value: "new-york", label: "New York" },
  { value: "london-ny-overlap", label: "London / NY Overlap" },
];

const RR_OPTIONS = [1, 1.5, 2, 3, 4];

export function ProfileEditor({
  initial,
  onSaved,
}: {
  initial: TradingProfile;
  onSaved?: (profile: TradingProfile) => void;
}) {
  const [p, setP] = useState<TradingProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => setP(initial), [initial]);

  const set = <K extends keyof TradingProfile>(k: K, v: TradingProfile[K]) => setP((prev) => ({ ...prev, [k]: v }));

  async function save() {
    setSaving(true);
    setStatus("idle");
    setErrorMsg(null);
    try {
      const instruments = new Set<TradingProfile["instruments"][number]>();
      const watch = new Set(p.watchlist);
      if (TOP_PAIRS_BY_CLASS.crypto.some((x) => watch.has(x))) instruments.add("crypto");
      if (TOP_PAIRS_BY_CLASS.forex.some((x) => watch.has(x))) instruments.add("forex");
      if (TOP_PAIRS_BY_CLASS.metals.some((x) => watch.has(x))) instruments.add("metals");
      if (TOP_PAIRS_BY_CLASS.indices.some((x) => watch.has(x))) instruments.add("indices");
      const payload: TradingProfile = { ...p, instruments: Array.from(instruments) };

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setStatus("saved");
      onSaved?.(payload);
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function togglePair(pair: string) {
    setP((prev) => {
      const list = prev.watchlist.includes(pair)
        ? prev.watchlist.filter((x) => x !== pair)
        : [...prev.watchlist, pair];
      return { ...prev, watchlist: list };
    });
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <User className="h-4 w-4 text-cyan-400" />
        <div className="text-sm font-semibold">Trading Profile</div>
      </div>

      {/* Account */}
      <div className="mb-5">
        <div className="mb-2 text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Account</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] text-[color:var(--color-fg-dim)]">Balance</label>
            <input
              type="number"
              value={p.accountBalance}
              onChange={(e) => set("accountBalance", parseFloat(e.target.value) || 0)}
              min={100}
              step={100}
              className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1.5 font-mono text-sm outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-[color:var(--color-fg-dim)]">Currency</label>
            <select
              value={p.accountCurrency}
              onChange={(e) => set("accountCurrency", e.target.value)}
              className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1.5 text-sm outline-none focus:border-cyan-400"
            >
              {["USD", "EUR", "GBP", "AUD", "CAD"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-[color:var(--color-fg-dim)]">Leverage</label>
            <select
              value={p.leverage}
              onChange={(e) => set("leverage", parseInt(e.target.value, 10))}
              className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1.5 text-sm outline-none focus:border-cyan-400"
            >
              {[30, 50, 100, 200, 500, 1000].map((l) => (
                <option key={l} value={l}>
                  1:{l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Style */}
      <div className="mb-5">
        <div className="mb-2 text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">
          Style <span className="ml-1 normal-case text-[10px] tracking-normal text-[color:var(--color-fg-dim)]">(how long you hold)</span>
        </div>
        <div className="flex gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => set("strategyStyle", s.value)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition",
                p.strategyStyle === s.value
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] hover:border-cyan-500/30",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy (methodology) */}
      <div className="mb-5">
        <div className="mb-2 text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">
          Strategy <span className="ml-1 normal-case text-[10px] tracking-normal text-[color:var(--color-fg-dim)]">(how you analyze)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {STRATEGY_ORDER.map((s) => {
            const info = STRATEGY_INFO[s];
            const active = (p.strategy ?? "price-action") === s;
            return (
              <button
                key={s}
                onClick={() => set("strategy", s)}
                title={info.desc}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-left text-[11px] font-medium transition",
                  active
                    ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] hover:border-cyan-500/30",
                )}
              >
                {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Risk */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Risk per trade</div>
          <span className="font-mono text-sm font-semibold text-cyan-400">{p.riskPerTradePct.toFixed(2)}%</span>
        </div>
        <input
          type="range"
          min={0.25}
          max={5}
          step={0.25}
          value={p.riskPerTradePct}
          onChange={(e) => set("riskPerTradePct", parseFloat(e.target.value))}
          className="w-full accent-cyan-400"
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] text-[color:var(--color-fg-dim)]">Preferred R:R</label>
            <div className="flex gap-1">
              {RR_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => set("preferredRR", r)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1 font-mono text-[11px] transition",
                    p.preferredRR === r
                      ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] hover:border-cyan-500/30",
                  )}
                >
                  1:{r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-[color:var(--color-fg-dim)]">Max concurrent</label>
            <div className="flex gap-1">
              {[1, 2, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => set("maxConcurrentTrades", n)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1 font-mono text-[11px] transition",
                    p.maxConcurrentTrades === n
                      ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] hover:border-cyan-500/30",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Session */}
      <div className="mb-5">
        <div className="mb-2 text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Session</div>
        <select
          value={p.session}
          onChange={(e) => set("session", e.target.value as TradingSession)}
          className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1.5 text-sm outline-none focus:border-cyan-400"
        >
          {SESSIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={p.avoidNews}
            onChange={(e) => set("avoidNews", e.target.checked)}
            className="h-4 w-4 accent-cyan-400"
          />
          Avoid trading ±30 min around red-folder news
        </label>
      </div>

      {/* Watchlist */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Watchlist</div>
          <span className="text-[10px] text-[color:var(--color-fg-dim)]">{p.watchlist.length} selected</span>
        </div>
        <div className="space-y-2">
          {(Object.keys(TOP_PAIRS_BY_CLASS) as Array<keyof typeof TOP_PAIRS_BY_CLASS>).map((cls) => (
            <div key={cls}>
              <div className="mb-1 text-[10px] uppercase text-[color:var(--color-fg-dim)]">{cls}</div>
              <div className="flex flex-wrap gap-1">
                {TOP_PAIRS_BY_CLASS[cls].map((pair) => {
                  const active = p.watchlist.includes(pair);
                  return (
                    <button
                      key={pair}
                      onClick={() => togglePair(pair)}
                      className={cn(
                        "rounded-md border px-2 py-0.5 font-mono text-[10px] transition",
                        active
                          ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                          : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] hover:border-cyan-500/30",
                      )}
                    >
                      {pair}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {errorMsg && <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">{errorMsg}</div>}

      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className={cn(
            "flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400",
            saving && "opacity-60",
          )}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : status === "saved" ? <Check className="h-3.5 w-3.5" /> : null}
          {saving ? "Saving…" : status === "saved" ? "Saved" : "Save profile"}
        </button>
        <button
          onClick={() => setP(initial)}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-xs text-[color:var(--color-fg-dim)] hover:border-cyan-400"
        >
          <RefreshCw className="h-3 w-3" /> Reset
        </button>
      </div>
    </div>
  );
}
