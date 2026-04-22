"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Send, Wrench, X } from "lucide-react";
import { SignalCard } from "@/components/signal-card";
import { fileToCompressedDataUrl } from "@/lib/image-utils";
import { STRATEGY_INFO, type Signal, type StrategyStyle, type TradingProfile, type TradingStrategy } from "@/lib/types";
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

type ChatEntry =
  | { kind: "user"; text: string; images: string[]; id: string }
  | { kind: "signal"; signal: Signal; id: string; trace?: ToolTrace[] }
  | { kind: "error"; text: string; id: string };

interface ToolTrace {
  tool: string;
  arguments: unknown;
  result: unknown;
}

const MAX_IMAGES = 4;

export function ChatView({
  profile,
  onAlertCreated,
}: {
  profile: TradingProfile | null;
  onAlertCreated?: () => void;
}) {
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showTrace, setShowTrace] = useState<Record<string, boolean>>({});
  const [style, setStyle] = useState<StrategyStyle>(profile?.strategyStyle ?? "day");
  const [strategy, setStrategy] = useState<TradingStrategy>(profile?.strategy ?? "price-action");

  useEffect(() => {
    if (profile?.strategyStyle) setStyle(profile.strategyStyle);
    if (profile?.strategy) setStrategy(profile.strategy);
  }, [profile?.strategyStyle, profile?.strategy]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const quickPairs = (profile?.watchlist && profile.watchlist.length > 0
    ? profile.watchlist
    : ["BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "XAUUSD"]
  ).slice(0, 6);

  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setCompressing(true);
    try {
      const remaining = MAX_IMAGES - pendingImages.length;
      const toAdd = arr.slice(0, remaining);
      const compressed = await Promise.all(toAdd.map((f) => fileToCompressedDataUrl(f)));
      setPendingImages((prev) => [...prev, ...compressed].slice(0, MAX_IMAGES));
    } catch (err) {
      console.error("Image processing failed:", err);
    } finally {
      setCompressing(false);
    }
  }

  async function submit(message: string) {
    const text = message.trim();
    const imgs = pendingImages;
    if ((!text && imgs.length === 0) || loading) return;

    setEntries((prev) => [...prev, { kind: "user", text, images: imgs, id: crypto.randomUUID() }]);
    setInput("");
    setPendingImages([]);
    setLoading(true);

    try {
      const res = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text || "Analyze the attached chart and give me a trade plan.",
          images: imgs,
          profile: { strategyStyle: style, strategy },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setEntries((prev) => [
          ...prev,
          { kind: "error", text: data.error || `HTTP ${res.status}`, id: crypto.randomUUID() },
        ]);
      } else if (data.signal) {
        setEntries((prev) => [
          ...prev,
          { kind: "signal", signal: data.signal, trace: data.toolTrace, id: crypto.randomUUID() },
        ]);
      } else {
        setEntries((prev) => [
          ...prev,
          { kind: "error", text: data.rawAssistantText || "No signal returned.", id: crypto.randomUUID() },
        ]);
      }
    } catch (err) {
      setEntries((prev) => [
        ...prev,
        { kind: "error", text: err instanceof Error ? err.message : String(err), id: crypto.randomUUID() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, loading]);

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of items) {
      if (it.kind === "file" && it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  const canSend = !loading && !compressing && (input.trim().length > 0 || pendingImages.length > 0);

  return (
    <div
      className="relative flex h-[calc(100dvh-3.5rem)] flex-col"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-cyan-500/10 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-cyan-400 bg-[color:var(--color-bg)]/80 px-10 py-8 text-center">
            <ImagePlus className="mx-auto h-8 w-8 text-cyan-400" />
            <div className="mt-2 text-sm font-semibold">Drop your chart screenshot</div>
            <div className="text-xs text-[color:var(--color-fg-dim)]">JPG · PNG · WEBP · up to 4 images</div>
          </div>
        </div>
      )}

      <div
        ref={scrollerRef}
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6"
      >
        {entries.length === 0 && (
          <div className="m-auto w-full max-w-lg rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center">
            <div className="text-sm font-medium">Ask for a trade signal — or drop a chart screenshot.</div>
            <div className="mt-1 text-xs text-[color:var(--color-fg-dim)]">
              Try: <span className="font-mono">"BTC"</span> ·{" "}
              <span className="font-mono">"signal on EURUSD"</span> · or paste / drop a chart image
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {quickPairs.map((p) => (
                <button
                  key={p}
                  onClick={() => submit(`Signal on ${p}`)}
                  className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 font-mono text-xs hover:border-cyan-400 hover:text-cyan-400"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {entries.map((e) => {
          if (e.kind === "user") {
            return (
              <div key={e.id} className="flex justify-end">
                <div className="flex max-w-[80%] flex-col items-end gap-1">
                  {e.images.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {e.images.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`attachment ${i + 1}`}
                          className="max-h-48 rounded-lg border border-[color:var(--color-border)] object-contain"
                        />
                      ))}
                    </div>
                  )}
                  {e.text && (
                    <div className="rounded-2xl rounded-tr-md bg-cyan-500/15 px-4 py-2 text-sm">{e.text}</div>
                  )}
                </div>
              </div>
            );
          }
          if (e.kind === "signal") {
            return (
              <div key={e.id} className="flex flex-col gap-2">
                <SignalCard signal={e.signal} onAlertCreated={onAlertCreated} />
                {e.trace && e.trace.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowTrace((s) => ({ ...s, [e.id]: !s[e.id] }))}
                      className="flex items-center gap-1.5 text-xs text-[color:var(--color-fg-dim)] hover:text-cyan-400"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      {showTrace[e.id] ? "Hide" : "Show"} tool trace ({e.trace.length})
                    </button>
                    {showTrace[e.id] && (
                      <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-[11px] leading-tight text-[color:var(--color-fg-dim)]">
                        {e.trace
                          .map((t) => `→ ${t.tool}(${JSON.stringify(t.arguments)})\n  ${summarizeResult(t.result)}`)
                          .join("\n\n")}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={e.id} className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {e.text}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-[color:var(--color-fg-dim)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing market data…
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-2 gap-y-1 px-4 pt-2 text-[11px] sm:px-6">
          <span className="text-[color:var(--color-fg-dim)]">Style:</span>
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
          <span className="ml-2 text-[color:var(--color-fg-dim)]">Strategy:</span>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as TradingStrategy)}
            className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[11px] outline-none focus:border-cyan-400"
          >
            {STRATEGY_ORDER.map((s) => (
              <option key={s} value={s}>
                {STRATEGY_INFO[s].label}
              </option>
            ))}
          </select>
        </div>
        {pendingImages.length > 0 && (
          <div className="mx-auto flex max-w-4xl flex-wrap gap-2 px-4 pt-3 sm:px-6">
            {pendingImages.map((src, i) => (
              <div key={i} className="group relative">
                <img
                  src={src}
                  alt={`pending ${i + 1}`}
                  className="h-20 w-auto rounded-lg border border-[color:var(--color-border)] object-contain"
                />
                <button
                  onClick={() => setPendingImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition group-hover:opacity-100"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {compressing && (
              <div className="flex h-20 items-center gap-2 rounded-lg border border-dashed border-[color:var(--color-border)] px-3 text-xs text-[color:var(--color-fg-dim)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Compressing…
              </div>
            )}
          </div>
        )}

        <div className="mx-auto flex max-w-4xl items-end gap-2 px-4 py-3 sm:px-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || pendingImages.length >= MAX_IMAGES}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] transition",
              "hover:border-cyan-400 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-40",
            )}
            title={`Attach chart image (${pendingImages.length}/${MAX_IMAGES})`}
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder={
              pendingImages.length > 0
                ? "Describe what you want (optional) — e.g. 'what's the setup on this EURUSD 4h chart'"
                : "Ask for a pair, or drop/paste a chart screenshot"
            }
            disabled={loading}
            className={cn(
              "min-h-[44px] flex-1 resize-none rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm outline-none placeholder:text-[color:var(--color-fg-dim)]",
              "focus:border-cyan-400",
              loading && "opacity-50",
            )}
          />
          <button
            onClick={() => submit(input)}
            disabled={!canSend}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-black transition",
              "hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40",
            )}
            title="Send"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-2 text-[10px] text-[color:var(--color-fg-dim)] sm:px-6">
          AI-generated analysis, not financial advice. You are responsible for every trade you take.
        </div>
      </div>
    </div>
  );
}

function summarizeResult(result: unknown): string {
  if (result == null) return "null";
  if (typeof result === "string") return result;
  try {
    const s = JSON.stringify(result);
    return s.length > 400 ? s.slice(0, 400) + "…" : s;
  } catch {
    return String(result);
  }
}
