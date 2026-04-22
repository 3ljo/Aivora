import { computeIndicators, getMarketSnapshot, type Timeframe } from "../market-data";
import type { AlertCondition } from "../types";
import type { AlertRule } from "./types";

export interface EvaluationResult {
  triggered: boolean;
  context: string;
  price: number | null;
}

export async function evaluateRule(rule: AlertRule): Promise<EvaluationResult> {
  const tfNeeded = new Set<Timeframe>();
  for (const c of rule.conditions) {
    if ("timeframe" in c) tfNeeded.add(c.timeframe as Timeframe);
  }
  if (tfNeeded.size === 0) tfNeeded.add("1m");

  const snapshots = new Map<Timeframe, Awaited<ReturnType<typeof getMarketSnapshot>>>();
  for (const tf of tfNeeded) {
    try {
      const snap = await getMarketSnapshot(rule.symbol, tf);
      snapshots.set(tf, snap);
    } catch (err) {
      return {
        triggered: false,
        context: `fetch failed on ${tf}: ${err instanceof Error ? err.message : String(err)}`,
        price: null,
      };
    }
  }

  const anyTf = snapshots.values().next().value;
  const price = anyTf?.price ?? null;

  const results = rule.conditions.map((c) => evalOne(c, snapshots));
  const allTrue = results.every((r) => r.ok);
  const context = results
    .map((r, i) => `${i + 1}. ${describeCondition(rule.conditions[i])} → ${r.detail}`)
    .join(" | ");

  return { triggered: allTrue, context, price };
}

function evalOne(
  c: AlertCondition,
  snapshots: Map<Timeframe, Awaited<ReturnType<typeof getMarketSnapshot>>>,
): { ok: boolean; detail: string } {
  switch (c.type) {
    case "price_above": {
      const snap = snapshots.values().next().value;
      const p = snap?.price ?? 0;
      return { ok: p > c.value, detail: `price ${p} ${p > c.value ? ">" : "<="} ${c.value}` };
    }
    case "price_below": {
      const snap = snapshots.values().next().value;
      const p = snap?.price ?? 0;
      return { ok: p < c.value, detail: `price ${p} ${p < c.value ? "<" : ">="} ${c.value}` };
    }
    case "candle_close_above": {
      const snap = snapshots.get(c.timeframe as Timeframe);
      const candles = snap?.candles ?? [];
      const last = candles[candles.length - 2] ?? candles[candles.length - 1];
      const close = last?.close ?? 0;
      return {
        ok: close > c.value,
        detail: `${c.timeframe} last close ${close} ${close > c.value ? ">" : "<="} ${c.value}`,
      };
    }
    case "candle_close_below": {
      const snap = snapshots.get(c.timeframe as Timeframe);
      const candles = snap?.candles ?? [];
      const last = candles[candles.length - 2] ?? candles[candles.length - 1];
      const close = last?.close ?? 0;
      return {
        ok: close < c.value,
        detail: `${c.timeframe} last close ${close} ${close < c.value ? "<" : ">="} ${c.value}`,
      };
    }
    case "rsi_above": {
      const snap = snapshots.get(c.timeframe as Timeframe);
      const rsi = snap ? computeIndicators(snap.candles).rsi14 : null;
      return {
        ok: rsi != null && rsi > c.value,
        detail: `${c.timeframe} RSI ${rsi?.toFixed(1) ?? "—"} ${rsi != null && rsi > c.value ? ">" : "<="} ${c.value}`,
      };
    }
    case "rsi_below": {
      const snap = snapshots.get(c.timeframe as Timeframe);
      const rsi = snap ? computeIndicators(snap.candles).rsi14 : null;
      return {
        ok: rsi != null && rsi < c.value,
        detail: `${c.timeframe} RSI ${rsi?.toFixed(1) ?? "—"} ${rsi != null && rsi < c.value ? "<" : ">="} ${c.value}`,
      };
    }
  }
}

export function describeCondition(c: AlertCondition): string {
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
