"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BellPlus, Check, Clock, Eye, Loader2, MinusCircle, Target, TrendingDown, TrendingUp } from "lucide-react";
import type { AlertTrigger, Signal } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

const VERDICT_STYLE = {
  BUY: {
    label: "BUY",
    icon: TrendingUp,
    bg: "bg-green-500/10",
    border: "border-green-500/40",
    text: "text-green-400",
    pill: "bg-green-500 text-black",
  },
  SELL: {
    label: "SELL",
    icon: TrendingDown,
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    text: "text-red-400",
    pill: "bg-red-500 text-black",
  },
  WAIT: {
    label: "WAIT — NO SETUP",
    icon: MinusCircle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    text: "text-amber-400",
    pill: "bg-amber-500 text-black",
  },
} as const;

function confidenceColor(c: number): string {
  if (c >= 70) return "bg-green-500";
  if (c >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function priceDigits(pair: string): number {
  const p = pair.toUpperCase();
  if (p.endsWith("JPY") || p.includes("JPY")) return 3;
  if (p.startsWith("XAU") || p.startsWith("XAG")) return 2;
  if (p.includes("BTC") || p.includes("ETH")) return 2;
  if (/^[A-Z]{6}$/.test(p)) return 5;
  return 2;
}

export function SignalCard({
  signal,
  onAlertCreated,
}: {
  signal: Signal;
  onAlertCreated?: () => void;
}) {
  const style = VERDICT_STYLE[signal.verdict];
  const Icon = style.icon;
  const digits = priceDigits(signal.pair);
  const isWait = signal.verdict === "WAIT";

  return (
    <div className={cn("rounded-xl border p-5 sm:p-6", style.bg, style.border)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", style.pill)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Signal</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{signal.pair}</span>
              <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", style.pill)}>{style.label}</span>
            </div>
          </div>
        </div>

        <div className="min-w-[180px]">
          <div className="mb-1 flex items-center justify-between text-xs text-[color:var(--color-fg-dim)]">
            <span>Confidence</span>
            <span className="font-mono font-semibold text-[color:var(--color-fg)]">{signal.confidence}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
            <div
              className={cn("h-full rounded-full transition-all", confidenceColor(signal.confidence))}
              style={{ width: `${Math.max(0, Math.min(100, signal.confidence))}%` }}
            />
          </div>
        </div>
      </div>

      {!isWait && (signal.entry != null || signal.stopLoss != null || signal.takeProfits.length > 0) && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PriceCell label="Entry" value={signal.entry} digits={digits} hint={signal.orderType ?? undefined} />
          <PriceCell label="Stop Loss" value={signal.stopLoss} digits={digits} variant="sell" />
          {signal.takeProfits.slice(0, 2).map((tp) => (
            <PriceCell
              key={tp.label}
              label={`${tp.label} (${tp.rr.toFixed(2)}R)`}
              value={tp.price}
              digits={digits}
              variant="buy"
            />
          ))}
        </div>
      )}

      {!isWait && signal.takeProfits.length > 2 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--color-fg-dim)]">
          {signal.takeProfits.slice(2).map((tp) => (
            <span key={tp.label} className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1 font-mono">
              {tp.label}: {formatPrice(tp.price, digits)} ({tp.rr.toFixed(2)}R)
            </span>
          ))}
        </div>
      )}

      {signal.positionSize && !isWait && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3 text-sm sm:grid-cols-4">
          <div>
            <div className="text-xs text-[color:var(--color-fg-dim)]">Size</div>
            <div className="font-mono font-semibold">{signal.positionSize.units.toLocaleString()} {signal.positionSize.unitLabel}</div>
          </div>
          <div>
            <div className="text-xs text-[color:var(--color-fg-dim)]">Risk</div>
            <div className="font-mono font-semibold text-red-400">
              {signal.positionSize.riskCurrency} {signal.positionSize.riskAmount.toLocaleString()}
            </div>
          </div>
          {signal.timeframe && (
            <div>
              <div className="text-xs text-[color:var(--color-fg-dim)]">Timeframe</div>
              <div className="font-mono font-semibold">{signal.timeframe}</div>
            </div>
          )}
          {signal.validUntil && (
            <div>
              <div className="text-xs text-[color:var(--color-fg-dim)] flex items-center gap-1">
                <Clock className="h-3 w-3" /> Valid until
              </div>
              <div className="font-mono text-xs">{new Date(signal.validUntil).toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 space-y-3">
        <ReasoningRow icon={TrendingUp} label="HTF Bias" value={signal.reasoning.htfBias} />
        <ReasoningRow icon={Target} label="Key Level" value={signal.reasoning.keyLevel} />
        {signal.reasoning.confluence.length > 0 && (
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-[color:var(--color-fg-dim)]">
              <ArrowUpRight className="h-3.5 w-3.5" /> Confluence
            </div>
            <ul className="ml-5 list-disc space-y-1 text-sm text-[color:var(--color-fg)]">
              {signal.reasoning.confluence.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        <ReasoningRow icon={ArrowDownRight} label="Invalidation" value={signal.reasoning.invalidation} />
      </div>

      {signal.alertTriggers && signal.alertTriggers.length > 0 && (
        <div className="mt-5 rounded-lg border border-cyan-500/40 bg-cyan-500/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-400">
            <Eye className="h-3.5 w-3.5" /> Watch For — triggers to take the trade
          </div>
          <div className="flex flex-col gap-2">
            {signal.alertTriggers.map((t, i) => (
              <TriggerRow key={i} trigger={t} onAlertCreated={onAlertCreated} />
            ))}
          </div>
        </div>
      )}

      {signal.warnings.length > 0 && (
        <div className="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Warnings
          </div>
          <ul className="ml-5 list-disc space-y-1 text-sm">
            {signal.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PriceCell({
  label,
  value,
  digits,
  hint,
  variant,
}: {
  label: string;
  value: number | null;
  digits: number;
  hint?: string;
  variant?: "buy" | "sell";
}) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <div className="flex items-center justify-between text-xs text-[color:var(--color-fg-dim)]">
        <span>{label}</span>
        {hint && <span className="uppercase tracking-wide">{hint}</span>}
      </div>
      <div
        className={cn(
          "mt-1 font-mono text-base font-semibold",
          variant === "buy" && "text-green-400",
          variant === "sell" && "text-red-400",
        )}
      >
        {formatPrice(value, digits)}
      </div>
    </div>
  );
}

function ReasoningRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-[color:var(--color-fg-dim)]">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function TriggerRow({
  trigger,
  onAlertCreated,
}: {
  trigger: AlertTrigger;
  onAlertCreated?: () => void;
}) {
  const [state, setState] = useState<"idle" | "creating" | "created" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function create() {
    setState("creating");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trigger),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setState("created");
      onAlertCreated?.();
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  const plan = trigger.tradePlan;

  return (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium">{trigger.description}</div>
          <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-[color:var(--color-fg-dim)]">
            <span className="rounded bg-[color:var(--color-bg)] px-1.5 py-0.5 font-mono">{trigger.symbol}</span>
            {trigger.conditions.map((c, i) => (
              <span key={i} className="rounded bg-[color:var(--color-bg)] px-1.5 py-0.5 font-mono">
                {describeCond(c)}
              </span>
            ))}
          </div>
          {plan && (
            <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-mono">
              <span className={cn("rounded px-1.5 py-0.5 font-semibold", plan.action === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                {plan.action} @ {plan.entry}
              </span>
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-400">SL {plan.stopLoss}</span>
              {plan.takeProfits.map((tp, i) => (
                <span key={i} className="rounded bg-green-500/10 px-1.5 py-0.5 text-green-400">
                  TP{i + 1} {tp}
                </span>
              ))}
            </div>
          )}
          {errorMsg && <div className="mt-1 text-xs text-red-400">{errorMsg}</div>}
        </div>
        <button
          onClick={create}
          disabled={state === "creating" || state === "created"}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition",
            state === "created"
              ? "bg-green-500/20 text-green-400 cursor-default"
              : state === "error"
                ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                : "bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-60",
          )}
        >
          {state === "creating" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : state === "created" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <BellPlus className="h-3.5 w-3.5" />
          )}
          {state === "created" ? "Alert set" : state === "creating" ? "Creating…" : state === "error" ? "Retry" : "Create alert"}
        </button>
      </div>
    </div>
  );
}

function describeCond(c: AlertTrigger["conditions"][number]): string {
  switch (c.type) {
    case "price_above":
      return `price > ${c.value}`;
    case "price_below":
      return `price < ${c.value}`;
    case "candle_close_above":
      return `${c.timeframe} close > ${c.value}`;
    case "candle_close_below":
      return `${c.timeframe} close < ${c.value}`;
    case "rsi_above":
      return `${c.timeframe} RSI > ${c.value}`;
    case "rsi_below":
      return `${c.timeframe} RSI < ${c.value}`;
  }
}
