"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCircle2, Loader2, Send, Settings2, Trash2 } from "lucide-react";
import type { AlertRule } from "@/lib/alerts/types";
import { cn } from "@/lib/utils";

interface ChannelStatus {
  telegram: { configured: boolean; enabled: boolean; linked: boolean };
}

const EMPTY_CHANNELS: ChannelStatus = {
  telegram: { configured: false, enabled: false, linked: false },
};

interface AlertsApiResponse {
  rules: AlertRule[];
  channels: ChannelStatus;
}

export function AlertsPanel({
  refreshSignal,
  defaultExpanded = true,
}: {
  refreshSignal: number;
  defaultExpanded?: boolean;
}) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [channels, setChannels] = useState<ChannelStatus>(EMPTY_CHANNELS);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      const data = (await res.json()) as AlertsApiResponse;
      setRules(data.rules || []);
      setChannels(data.channels || EMPTY_CHANNELS);
    } catch (err) {
      console.error("alerts load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15_000);
    return () => clearInterval(iv);
  }, [load, refreshSignal]);

  const active = rules.filter((r) => r.status === "active");
  const triggered = rules.filter((r) => r.status === "triggered");

  async function update(id: string, patch: Partial<AlertRule>) {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    load();
  }

  const telegramReady = channels.telegram.configured && channels.telegram.enabled && channels.telegram.linked;

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-cyan-400" />
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Active Alerts</div>
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-400">
            {active.length}
          </span>
          {triggered.length > 0 && (
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-400">
              {triggered.length} fired
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[color:var(--color-fg-dim)]">
          <span
            title={telegramReady ? "Telegram ready" : "Telegram not connected"}
            className={cn("flex items-center gap-1", telegramReady ? "text-cyan-400" : "opacity-40")}
          >
            <Send className="h-3 w-3" /> Telegram
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3">
          {!telegramReady && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-xs text-amber-300">
              <span>Telegram not connected — you won&apos;t get pinged when alerts fire.</span>
              <Link
                href="/settings"
                className="flex shrink-0 items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-medium text-amber-200 hover:bg-amber-500/20"
              >
                <Settings2 className="h-3 w-3" /> Connect
              </Link>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-[color:var(--color-fg-dim)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          ) : rules.length === 0 ? (
            <div className="text-xs text-[color:var(--color-fg-dim)]">
              No alerts yet. Ask the AI for a signal, then click <b>Create alert</b> on any trigger.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...triggered, ...active, ...rules.filter((r) => r.status === "disabled")].map((r) => (
                <li
                  key={r.id}
                  className={cn(
                    "rounded-md border p-2.5 text-xs",
                    r.status === "triggered" && "border-green-500/40 bg-green-500/5",
                    r.status === "active" && "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]",
                    r.status === "disabled" && "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] opacity-50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[color:var(--color-fg-dim)]">{r.symbol}</span>
                        {r.status === "triggered" && (
                          <span className="inline-flex items-center gap-1 rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-green-400">
                            <CheckCircle2 className="h-3 w-3" /> FIRED
                          </span>
                        )}
                        {r.status === "disabled" && (
                          <span className="rounded bg-[color:var(--color-bg)] px-1.5 py-0.5 text-[10px] text-[color:var(--color-fg-dim)]">
                            disabled
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[color:var(--color-fg)]">{r.description}</div>
                      {r.tradePlan && (
                        <div className="mt-1 font-mono text-[10px] text-[color:var(--color-fg-dim)]">
                          <span className={r.tradePlan.action === "BUY" ? "text-green-400" : "text-red-400"}>
                            {r.tradePlan.action}
                          </span>{" "}
                          @ {r.tradePlan.entry} · SL {r.tradePlan.stopLoss}
                          {r.tradePlan.takeProfits.length > 0 && ` · TP ${r.tradePlan.takeProfits.join("/")}`}
                        </div>
                      )}
                      {r.triggeredAt && (
                        <div className="mt-1 text-[10px] text-green-400">
                          Fired at {new Date(r.triggeredAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {r.status === "active" && (
                        <button
                          onClick={() => update(r.id, { status: "disabled" })}
                          className="rounded p-1.5 text-[color:var(--color-fg-dim)] hover:bg-[color:var(--color-bg)] hover:text-amber-400"
                          title="Pause"
                        >
                          <BellOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.status === "disabled" && (
                        <button
                          onClick={() => update(r.id, { status: "active" })}
                          className="rounded p-1.5 text-[color:var(--color-fg-dim)] hover:bg-[color:var(--color-bg)] hover:text-cyan-400"
                          title="Re-enable"
                        >
                          <Bell className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.status === "triggered" && (
                        <button
                          onClick={() => update(r.id, { status: "active" })}
                          className="rounded p-1.5 text-[color:var(--color-fg-dim)] hover:bg-[color:var(--color-bg)] hover:text-cyan-400"
                          title="Reset (re-arm)"
                        >
                          <Bell className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => remove(r.id)}
                        className="rounded p-1.5 text-[color:var(--color-fg-dim)] hover:bg-[color:var(--color-bg)] hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
