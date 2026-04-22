"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  Coins,
  Gauge,
  Loader2,
  Mountain,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { TOP_PAIRS_BY_CLASS, DEFAULT_PROFILE } from "@/lib/profile";
import { STRATEGY_INFO, type StrategyStyle, type TradingProfile, type TradingSession, type TradingStrategy } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { title: "Pairs", hint: "What do you want to track" },
  { title: "Style", hint: "Scalp / Day / Swing / Position" },
  { title: "Strategy", hint: "Your trading method" },
  { title: "Account", hint: "Balance + leverage" },
  { title: "Session", hint: "When you trade" },
  { title: "Risk", hint: "How aggressive" },
];

const STYLE_OPTIONS: Array<{
  value: StrategyStyle;
  label: string;
  desc: string;
  tf: string;
  hold: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "scalp", label: "Scalper", desc: "Fast in, fast out", tf: "1m · 5m", hold: "5-30 min", icon: Gauge },
  { value: "day", label: "Day Trader", desc: "Close by session end", tf: "15m · 1h", hold: "hours", icon: BarChart3 },
  { value: "swing", label: "Swing Trader", desc: "Multi-day holds", tf: "4h · 1d", hold: "days-weeks", icon: TrendingUp },
  { value: "position", label: "Position", desc: "Long-term macro", tf: "1d · 1w", hold: "weeks-months", icon: Mountain },
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

const SESSION_OPTIONS: Array<{ value: TradingSession; label: string; hours: string }> = [
  { value: "sydney", label: "Sydney", hours: "22:00–07:00 UTC" },
  { value: "tokyo", label: "Tokyo", hours: "00:00–09:00 UTC" },
  { value: "london", label: "London", hours: "08:00–17:00 UTC" },
  { value: "new-york", label: "New York", hours: "13:00–22:00 UTC" },
  { value: "london-ny-overlap", label: "London / NY Overlap", hours: "13:00–17:00 UTC · highest volume" },
];

const RR_OPTIONS = [1, 1.5, 2, 3, 4];

export function OnboardingWizard({ onComplete }: { onComplete: (profile: TradingProfile) => void }) {
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(
    new Set([
      ...TOP_PAIRS_BY_CLASS.crypto,
      ...TOP_PAIRS_BY_CLASS.forex,
      ...TOP_PAIRS_BY_CLASS.metals,
      ...TOP_PAIRS_BY_CLASS.indices,
    ]),
  );
  const [style, setStyle] = useState<StrategyStyle>("day");
  const [strategy, setStrategy] = useState<TradingStrategy>("price-action");
  const [balance, setBalance] = useState<number>(10000);
  const [currency, setCurrency] = useState<string>("USD");
  const [leverage, setLeverage] = useState<number>(100);
  const [session, setSession] = useState<TradingSession>("london-ny-overlap");
  const [avoidNews, setAvoidNews] = useState<boolean>(true);
  const [risk, setRisk] = useState<number>(1);
  const [rr, setRR] = useState<number>(2);
  const [maxTrades, setMaxTrades] = useState<number>(3);

  const canNext = (() => {
    if (step === 0) return selectedPairs.size > 0;
    if (step === 3) return balance > 0 && leverage > 0;
    return true;
  })();

  function togglePair(p: string) {
    setSelectedPairs((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function toggleClass(cls: keyof typeof TOP_PAIRS_BY_CLASS) {
    const pairs = TOP_PAIRS_BY_CLASS[cls];
    const allSelected = pairs.every((p) => selectedPairs.has(p));
    setSelectedPairs((prev) => {
      const next = new Set(prev);
      if (allSelected) pairs.forEach((p) => next.delete(p));
      else pairs.forEach((p) => next.add(p));
      return next;
    });
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const pairs = Array.from(selectedPairs);
      const instruments = new Set<TradingProfile["instruments"][number]>();
      if (TOP_PAIRS_BY_CLASS.crypto.some((p) => selectedPairs.has(p))) instruments.add("crypto");
      if (TOP_PAIRS_BY_CLASS.forex.some((p) => selectedPairs.has(p))) instruments.add("forex");
      if (TOP_PAIRS_BY_CLASS.metals.some((p) => selectedPairs.has(p))) instruments.add("metals");
      if (TOP_PAIRS_BY_CLASS.indices.some((p) => selectedPairs.has(p))) instruments.add("indices");

      const profile: TradingProfile = {
        ...DEFAULT_PROFILE,
        instruments: Array.from(instruments),
        watchlist: pairs,
        accountBalance: balance,
        accountCurrency: currency,
        leverage,
        strategyStyle: style,
        strategy,
        session,
        avoidNews,
        riskPerTradePct: risk,
        preferredRR: rr,
        maxConcurrentTrades: maxTrades,
      };

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      onComplete(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500 text-black">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold tracking-tight">Welcome to SignalForge</div>
          <div className="text-xs text-[color:var(--color-fg-dim)]">
            6-step setup — shapes how the AI analyzes for you
          </div>
        </div>
      </header>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[color:var(--color-fg-dim)]">
            <span>Step {step + 1} of 6</span>
            <span className="text-[color:var(--color-fg)]">— {STEPS[step].title}</span>
          </div>
          <div className="text-[color:var(--color-fg-dim)]">{STEPS[step].hint}</div>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                i <= step ? "bg-cyan-400" : "bg-[color:var(--color-surface-2)]",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1">
        {step === 0 && (
          <StepCard title="What do you want to track?" hint="Pick any pairs across asset classes. The AI will only analyze these.">
            <div className="space-y-4">
              {(Object.keys(TOP_PAIRS_BY_CLASS) as Array<keyof typeof TOP_PAIRS_BY_CLASS>).map((cls) => {
                const pairs = TOP_PAIRS_BY_CLASS[cls];
                const allOn = pairs.every((p) => selectedPairs.has(p));
                const someOn = pairs.some((p) => selectedPairs.has(p));
                return (
                  <div key={cls}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">
                        {cls}
                      </div>
                      <button
                        onClick={() => toggleClass(cls)}
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                      >
                        {allOn ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pairs.map((p) => {
                        const active = selectedPairs.has(p);
                        return (
                          <button
                            key={p}
                            onClick={() => togglePair(p)}
                            className={cn(
                              "rounded-md border px-3 py-1.5 font-mono text-xs transition",
                              active
                                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                                : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] hover:border-cyan-500/30",
                            )}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    {!allOn && !someOn && (
                      <div className="mt-1 text-[10px] text-[color:var(--color-fg-dim)]">none selected</div>
                    )}
                  </div>
                );
              })}
              <div className="pt-2 text-center text-xs text-[color:var(--color-fg-dim)]">
                <span className="font-mono text-cyan-400">{selectedPairs.size}</span> pair{selectedPairs.size === 1 ? "" : "s"} selected
              </div>
            </div>
          </StepCard>
        )}

        {step === 1 && (
          <StepCard title="What's your style?" hint="Sets default timeframes and hold durations. This is about HOW LONG you hold trades.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STYLE_OPTIONS.map((opt) => {
                const active = style === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStyle(opt.value)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition",
                      active
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] hover:border-cyan-500/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                        active ? "bg-cyan-500 text-black" : "bg-[color:var(--color-bg)] text-[color:var(--color-fg-dim)]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{opt.label}</div>
                        {active && <Check className="h-4 w-4 text-cyan-400" />}
                      </div>
                      <div className="text-xs text-[color:var(--color-fg-dim)]">{opt.desc}</div>
                      <div className="mt-1 flex gap-3 font-mono text-[10px] text-[color:var(--color-fg-dim)]">
                        <span>TF {opt.tf}</span>
                        <span>Hold {opt.hold}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard title="What's your strategy?" hint="The methodology the AI uses to analyze charts. This is about HOW you decide to trade.">
            <div className="space-y-2">
              {STRATEGY_ORDER.map((s) => {
                const info = STRATEGY_INFO[s];
                const active = strategy === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStrategy(s)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg border p-3 text-left transition",
                      active
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] hover:border-cyan-500/30",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-3 w-3 shrink-0 rounded-full border-2",
                        active ? "border-cyan-400 bg-cyan-400" : "border-[color:var(--color-border)]",
                      )}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{info.label}</div>
                      <div className="text-xs text-[color:var(--color-fg-dim)]">{info.desc}</div>
                    </div>
                    {active && <Check className="h-4 w-4 shrink-0 text-cyan-400" />}
                  </button>
                );
              })}

            </div>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard title="Account" hint="Used to size positions. Stored locally only.">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-[color:var(--color-fg-dim)]">Balance</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                    min={100}
                    step={100}
                    className="flex-1 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 font-mono text-sm outline-none focus:border-cyan-400"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-[color:var(--color-fg-dim)]">Leverage</label>
                <div className="flex flex-wrap gap-1.5">
                  {[30, 50, 100, 200, 500, 1000].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLeverage(l)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 font-mono text-xs transition",
                        leverage === l
                          ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                          : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] hover:border-cyan-500/30",
                      )}
                    >
                      1:{l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3 text-xs text-[color:var(--color-fg-dim)]">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-cyan-400" />
                  <span>
                    Sample position at 1% risk with 20-pip SL on EURUSD:{" "}
                    <span className="font-mono text-[color:var(--color-fg)]">
                      ~{((balance * 0.01) / 20 / 10).toFixed(2)} lots
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </StepCard>
        )}

        {step === 4 && (
          <StepCard title="When do you trade?" hint="AI will factor in session liquidity and volatility.">
            <div className="space-y-2">
              {SESSION_OPTIONS.map((opt) => {
                const active = session === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSession(opt.value)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
                      active
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] hover:border-cyan-500/30",
                    )}
                  >
                    <Clock className={cn("h-4 w-4 shrink-0", active ? "text-cyan-400" : "text-[color:var(--color-fg-dim)]")} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{opt.label}</div>
                        {active && <Check className="h-4 w-4 text-cyan-400" />}
                      </div>
                      <div className="font-mono text-[11px] text-[color:var(--color-fg-dim)]">{opt.hours}</div>
                    </div>
                  </button>
                );
              })}

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3 text-sm">
                <input
                  type="checkbox"
                  checked={avoidNews}
                  onChange={(e) => setAvoidNews(e.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
                <span>Avoid trading ±30 min around red-folder news</span>
              </label>
            </div>
          </StepCard>
        )}

        {step === 5 && (
          <StepCard title="Risk per trade" hint="How much of your balance you'll risk on any single trade.">
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs text-[color:var(--color-fg-dim)]">Risk per trade</label>
                  <span className="font-mono text-lg font-semibold text-cyan-400">{risk.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min={0.25}
                  max={5}
                  step={0.25}
                  value={risk}
                  onChange={(e) => setRisk(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <div className="mt-1 flex justify-between text-[10px] text-[color:var(--color-fg-dim)]">
                  <span>0.25% (safe)</span>
                  <span>5% (aggressive)</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--color-fg-dim)]">
                  <Coins className="h-3.5 w-3.5 text-cyan-400" />
                  Risks <span className="font-mono text-[color:var(--color-fg)]">{currency} {(balance * risk / 100).toFixed(2)}</span> per losing trade
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-[color:var(--color-fg-dim)]">Preferred reward : risk</label>
                <div className="flex gap-1.5">
                  {RR_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRR(r)}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-1.5 font-mono text-xs transition",
                        rr === r
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
                <label className="mb-1.5 block text-xs text-[color:var(--color-fg-dim)]">
                  Max concurrent open trades
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 5, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxTrades(n)}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-1.5 font-mono text-xs transition",
                        maxTrades === n
                          ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                          : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-dim)] hover:border-cyan-500/30",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs">
                <div className="mb-1 flex items-center gap-1.5 text-cyan-400">
                  <Target className="h-3.5 w-3.5" /> Ready
                </div>
                <div className="text-[color:var(--color-fg-dim)]">
                  {selectedPairs.size} pairs · {style} · {STRATEGY_INFO[strategy].label} · {currency} {balance.toLocaleString()} @ 1:{leverage} · {session.replace("-", " ")} ·
                  {" "}risk {risk}% · target R:R 1:{rr}
                </div>
              </div>
            </div>
          </StepCard>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">{error}</div>
      )}

      <div className="mt-6 flex items-center justify-between gap-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
          disabled={step === 0 || submitting}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm transition",
            step === 0 || submitting
              ? "cursor-not-allowed border-[color:var(--color-border)] text-[color:var(--color-fg-dim)] opacity-50"
              : "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] hover:border-cyan-400",
          )}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep((s) => Math.min(5, s + 1) as Step)}
            disabled={!canNext}
            className={cn(
              "flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400",
              !canNext && "cursor-not-allowed opacity-50",
            )}
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={submitting}
            className={cn(
              "flex items-center gap-1.5 rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400",
              submitting && "opacity-60",
            )}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {submitting ? "Saving…" : "Finish setup"}
          </button>
        )}
      </div>
    </div>
  );
}

function StepCard({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
      <div className="mb-1 text-base font-semibold">{title}</div>
      <div className="mb-4 text-xs text-[color:var(--color-fg-dim)]">{hint}</div>
      {children}
    </div>
  );
}
