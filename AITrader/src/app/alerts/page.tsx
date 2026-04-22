"use client";

import { AlertsPanel } from "@/components/alerts-panel";

export default function AlertsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-dim)]">Saved Alerts</div>
        <p className="mt-1 text-sm text-[color:var(--color-fg-dim)]">
          Price-based triggers the monitor checks every 60 seconds. When conditions hit, Telegram pings you.
          Zero AI tokens — just live price comparisons.
        </p>
      </div>
      <AlertsPanel refreshSignal={0} defaultExpanded />
    </div>
  );
}
