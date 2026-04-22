import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_PROFILE, DEFAULT_WATCHLIST } from "@/lib/profile";
import { generateSignal } from "@/lib/signal-engine";
import { dispatchScanFinding } from "@/lib/alerts/channels/dispatch";
import { readSettings } from "@/lib/alerts/settings";
import type { Signal, TradingProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const CONCURRENCY = 2;
const DEFAULT_MIN_CONFIDENCE = 65;

interface ScanResult {
  pair: string;
  ok: boolean;
  signal?: Signal;
  error?: string;
  notified?: boolean;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set." }, { status: 500 });
  }

  let body: { pairs?: string[]; minConfidence?: number; profile?: Partial<TradingProfile> } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const settings = await readSettings();
  const savedProfile = settings.profile;
  const defaultPairs = savedProfile?.watchlist?.length ? savedProfile.watchlist : DEFAULT_WATCHLIST;
  const pairs = Array.isArray(body.pairs) && body.pairs.length > 0 ? body.pairs : defaultPairs;
  const minConfidence = Number.isFinite(body.minConfidence) ? (body.minConfidence as number) : DEFAULT_MIN_CONFIDENCE;
  const profile: TradingProfile = {
    ...DEFAULT_PROFILE,
    ...(savedProfile ?? {}),
    ...(body.profile ?? {}),
  };

  const results: ScanResult[] = [];
  const queue = [...pairs];

  async function worker() {
    while (queue.length > 0) {
      const pair = queue.shift();
      if (!pair) return;
      try {
        const out = await generateSignal(`Scan for a high-probability setup on ${pair} right now.`, profile);
        if (out.signal) {
          const s = out.signal;
          let notified = false;
          if ((s.verdict === "BUY" || s.verdict === "SELL") && s.confidence >= minConfidence) {
            const d = await dispatchScanFinding(s);
            notified = Boolean(d.telegram?.ok);
          }
          results.push({ pair, ok: true, signal: s, notified });
        } else {
          results.push({ pair, ok: false, error: out.error || "no signal returned" });
        }
      } catch (err) {
        results.push({ pair, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, pairs.length) }, () => worker());
  await Promise.all(workers);

  const findings = results.filter((r) => r.ok && r.signal && (r.signal.verdict === "BUY" || r.signal.verdict === "SELL"));
  findings.sort((a, b) => (b.signal?.confidence ?? 0) - (a.signal?.confidence ?? 0));

  return NextResponse.json({
    scannedAt: new Date().toISOString(),
    totalScanned: pairs.length,
    totalFindings: findings.length,
    minConfidence,
    notifiedCount: results.filter((r) => r.notified).length,
    results,
  });
}
