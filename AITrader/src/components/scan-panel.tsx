"use client";

import { useState } from "react";
import { BellPlus, Check, Loader2, Radar, TrendingDown, TrendingUp } from "lucide-react";
import { STRATEGY_INFO, type AlertTrigger, type Signal, type StrategyStyle, type TradingStrategy } from "@/lib/types";
import { DEFAULT_WATCHLIST, TOP_PAIRS_BY_CLASS } from "@/lib/profile";
import { cn, formatPrice } from "@/lib/utils";

interface ScanResultItem {
  pair: string;
  ok: boolean;
  signal?: Signal;
  error?: string;
  notified?: boolean;
}

interface ScanResponse {
  scannedAt: string;
  totalScanned: number;
  totalFindings: number;
  minConfidence: number;
  notifiedCount: number;
  results: ScanResultItem[];
}

const CLASS_LABELS: Record<keyof typeof TOP_PAIRS_BY_CLASS, string> = {
  crypto: "Crypto",
  forex: "Forex",
  metals: "Metals",
  indices: "Indices",
};

export function ScanPanel({
  onAlertCreated,
  defaultExpanded = false,
}: {
  onAlertCreated?: () => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(65);
  const [style, setStyle] = useState<StrategyStyle>("day");
  const [strategy, setStrategy] = useState<TradingStrategy>("price-action");
  const [selectedClasses, setSelectedClasses] = useState<Record<keyof typeof TOP_PAIRS_BY_CLASS, boolean>>({
    crypto: true,
    forex: true,
    metals: true,
    indices: true,
  });

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

  const pairsToScan = Object.keys(TOP_PAIRS_BY_CLASS)
    .flatMap((k) =>
      selectedClasses[k as keyof typeof TOP_PAIRS_BY_CLASS] ? TOP_PAIRS_BY_CLASS[k as keyof typeof TOP_PAIRS_BY_CLASS] : [],
    )
    .filter(Boolean) as string[];

  async function runScan() {
    if (loading || pairsToScan.length === 0) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairs: pairsToScan,
          minConfidence: threshold,
          profile: { strategyStyle: style, strategy },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResponse(data as ScanResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const findings = (response?.results ?? []).filter(
    (r) => r.ok && r.signal && (r.signal.verdict === "BUY" || r.signal.verdict === "SELL"),
  );
  const waits = (response?.results ?? []).filter((r) => r.ok && r.signal && r.signal.verdict === "WAIT");
  const errors = (response?.results ?? []).filter((r) => !r.ok);

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-cyan-400" />
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Scan Watchlist</div>
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-400">
            {pairsToScan.length} pairs
          </span>
          {response && (
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-400">
              {findings.length} found
            </span>
          )}
        </div>
        <div className="text-[10px] text-[color:var(--color-fg-dim)]">{expanded ? "Hide" : "Show"}</div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TOP_PAIRS_BY_CLASS) as Array<keyof typeof TOP_PAIRS_BY_CLASS>).map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClasses((s) => ({ ...s, [cls]: !s[cls] }))}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                  selectedClasses[cls]
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] opacity-50",
                )}
              >
                {CLASS_LABELS[cls]}
                <span className="ml-1 text-[10px] opacity-70">({TOP_PAIRS_BY_CLASS[cls].length})</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <label className="text-[color:var(--color-fg-dim)]">Style</label>
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={cn(
                  "rounded-md border px-2 py-0.5 transition",
                  style === s.value
                    ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] hover:border-cyan-500/30",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <label className="text-[color:var(--color-fg-dim)]">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as TradingStrategy)}
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-0.5 outline-none focus:border-cyan-400"
            >
              {STRATEGY_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STRATEGY_INFO[s].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-[color:var(--color-fg-dim)]">Min confidence</label>
            <input
              type="range"
              min={50}
              max={90}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="flex-1 accent-cyan-400"
            />
            <span className="w-10 text-right font-mono text-cyan-400">{threshold}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runScan}
              disabled={loading || pairsToScan.length === 0}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition",
                "hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
              {loading ? `Scanning ${pairsToScan.length} pairs…` : `Scan ${pairsToScan.length} pairs`}
            </button>
            <div className="text-[10px] text-[color:var(--color-fg-dim)]">
              Uses OpenAI tokens — ~$0.02-0.05 per pair. Only runs when you click.
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">{error}</div>
          )}

          {response && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-2 text-xs">
                <span>
                  Scanned <b>{response.totalScanned}</b> · Found <b className="text-green-400">{findings.length}</b> ·
                  Wait <b className="text-amber-400">{waits.length}</b>
                  {errors.length > 0 && (
                    <>
                      {" "}
                      · Errors <b className="text-red-400">{errors.length}</b>
                    </>
                  )}
                </span>
                {response.notifiedCount > 0 && (
                  <span className="font-semibold text-cyan-400">📱 {response.notifiedCount} sent to Telegram</span>
                )}
              </div>

              {findings.length === 0 && errors.length === 0 && (
                <div className="rounded-md border border-dashed border-[color:var(--color-border)] p-3 text-center text-xs text-[color:var(--color-fg-dim)]">
                  No setups above {threshold}% confidence right now. Lower the threshold or scan again later.
                </div>
              )}

              {findings.map((f) => (
                <ScanFindingRow key={f.pair} finding={f} onAlertCreated={onAlertCreated} />
              ))}

              {waits.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs text-[color:var(--color-fg-dim)] hover:text-cyan-400">
                    {waits.length} WAIT results (no setup right now)
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {waits.map((w) => (
                      <span
                        key={w.pair}
                        className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-0.5 font-mono text-[10px] text-[color:var(--color-fg-dim)]"
                      >
                        {w.pair} · {w.signal?.confidence ?? 0}%
                      </span>
                    ))}
                  </div>
                </details>
              )}

              {errors.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-xs text-red-400">{errors.length} errors</summary>
                  <ul className="mt-2 ml-4 list-disc space-y-1 text-[10px] text-red-300">
                    {errors.map((e) => (
                      <li key={e.pair}>
                        <span className="font-mono">{e.pair}</span>: {e.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScanFindingRow({
  finding,
  onAlertCreated,
}: {
  finding: ScanResultItem;
  onAlertCreated?: () => void;
}) {
  const s = finding.signal!;
  const isBuy = s.verdict === "BUY";
  const priceDigits = /^[A-Z]{6}$/.test(s.pair.toUpperCase()) ? 5 : 2;

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        isBuy ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md",
              isBuy ? "bg-green-500 text-black" : "bg-red-500 text-black",
            )}
          >
            {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-semibold">{s.pair}</span>
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", isBuy ? "bg-green-500 text-black" : "bg-red-500 text-black")}>
                {s.verdict}
              </span>
              <span className="text-xs text-[color:var(--color-fg-dim)]">{s.confidence}%</span>
              {finding.notified && <span className="text-[10px] text-cyan-400">📱 sent</span>}
            </div>
            {s.entry != null && s.stopLoss != null && (
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px]">
                <span className="text-[color:var(--color-fg-dim)]">
                  entry <span className="text-[color:var(--color-fg)]">{formatPrice(s.entry, priceDigits)}</span>
                </span>
                <span className="text-[color:var(--color-fg-dim)]">
                  SL <span className="text-red-400">{formatPrice(s.stopLoss, priceDigits)}</span>
                </span>
                {s.takeProfits.slice(0, 2).map((tp, i) => (
                  <span key={i} className="text-[color:var(--color-fg-dim)]">
                    {tp.label || `TP${i + 1}`} <span className="text-green-400">{formatPrice(tp.price, priceDigits)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-[color:var(--color-fg-dim)]">
        {s.reasoning.htfBias}
      </div>
      {s.alertTriggers && s.alertTriggers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {s.alertTriggers.map((t, i) => (
            <CreateAlertChip key={i} trigger={t} onAlertCreated={onAlertCreated} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateAlertChip({
  trigger,
  onAlertCreated,
}: {
  trigger: AlertTrigger;
  onAlertCreated?: () => void;
}) {
  const [state, setState] = useState<"idle" | "creating" | "created" | "error">("idle");

  async function create() {
    setState("creating");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trigger),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("created");
      onAlertCreated?.();
    } catch {
      setState("error");
    }
  }

  return (
    <button
      onClick={create}
      disabled={state === "creating" || state === "created"}
      title={trigger.description}
      className={cn(
        "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition",
        state === "created"
          ? "border-green-500/40 bg-green-500/10 text-green-400"
          : state === "error"
            ? "border-red-500/40 bg-red-500/10 text-red-300"
            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20",
      )}
    >
      {state === "creating" ? <Loader2 className="h-3 w-3 animate-spin" /> : state === "created" ? <Check className="h-3 w-3" /> : <BellPlus className="h-3 w-3" />}
      {state === "created" ? "Alerted" : trigger.description.slice(0, 28)}
      {trigger.description.length > 28 ? "…" : ""}
    </button>
  );
}
